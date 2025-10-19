// app/api/pdf-email/route.js
import { NextResponse } from "next/server";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "fontkit";

export const runtime = "nodejs";
const RESEND_API_URL = "https://api.resend.com/emails";

/* -------------------- helpers -------------------- */

// リクエストURLからオリジン（Vercel/ローカル両対応）
function getOrigin(req) {
  try {
    const u = new URL(req.url);
    return `${u.protocol}//${u.host}`;
  } catch {
    return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  }
}

// 空レス/壊れたJSONでも安全にパース
async function readJsonSafe(req) {
  try {
    const txt = await req.text(); // まず text で受ける
    if (!txt) return {};
    try { return JSON.parse(txt); } catch { return {}; }
  } catch {
    return {};
  }
}

// Resend呼び出し（タイムアウト付き）
async function resendEmail(payload, timeoutMs = 20_000) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);

  try {
    const r = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: ac.signal,
    });

    // Resendは通常202+JSON {id: "..."} を返す
    const raw = await r.text();
    let json = null; try { json = JSON.parse(raw); } catch {}

    if (!r.ok) {
      return { ok: false, status: r.status, raw, json };
    }
    return { ok: true, status: r.status, raw, json };
  } finally {
    clearTimeout(t);
  }
}

/* -------------------- PDF -------------------- */

async function makePlanPdf({ email, title = "AIヘルス週次プラン", plan = [], fontBytes }) {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);

  // 日本語フォントを埋め込み（subsetでサイズ節約）
  const jpFont = await pdf.embedFont(fontBytes, { subset: true });

  const page = pdf.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();

  const draw = (text, x, y, size = 12, color = rgb(0, 0, 0)) => {
    page.drawText(String(text ?? ""), { x, y, size, font: jpFont, color });
  };

  // ヘッダー
  draw(title, 40, height - 60, 20);
  draw(`送付先: ${email}`, 40, height - 90, 10, rgb(0.2, 0.2, 0.2));

  const lines = plan.length
    ? plan
    : [
        "月: 納豆ご飯 + 味噌汁 / 30分ウォーキング",
        "火: 鶏むね肉の照り焼き / 20分ストレッチ",
        "水: 野菜たっぷりカレー / 休息",
        "木: さば味噌 / 30分ウォーキング",
        "金: 豚しゃぶサラダ / 20分筋トレ",
        "土: パスタ + サラダ / 軽い散歩",
        "日: 好きなもの少量 / 休息",
      ];

  let y = height - 130;
  draw("7日メニュー（食事/運動）", 40, y, 14);
  y -= 20;

  for (const line of lines) {
    if (y < 60) {
      const next = pdf.addPage([595.28, 841.89]);
      next.drawText("続き", { x: 40, y: 800, size: 12, font: jpFont });
      y = 770;
    } else {
      draw(`• ${line}`, 48, y, 12);
      y -= 18;
    }
  }

  const bytes = await pdf.save();
  return Buffer.from(bytes);
}

/* -------------------- Routes -------------------- */

// 診断: 環境と送信先を確認
export async function GET(req) {
  const email = new URL(req.url).searchParams.get("email") || "";
  return NextResponse.json({
    ok: true,
    diag: {
      email,
      origin: getOrigin(req),
      hasKey: !!process.env.RESEND_API_KEY,
      from: process.env.RESEND_FROM || "",
      runtime: "nodejs",
    },
  });
}

// 送信: POST { email, title?, plan?[] }
export async function POST(req) {
  try {
    // 1) 入力を安全に読み取る（空ボディ耐性）
    const body = await readJsonSafe(req);
    const to = (body?.email || "").trim();
    const title = body?.title || "AIヘルス週次プラン";
    const plan = Array.isArray(body?.plan) ? body.plan : [];

    if (!to) {
      return NextResponse.json(
        { ok: false, error: "email is required" },
        { status: 400 },
      );
    }
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { ok: false, error: "RESEND_API_KEY not set" },
        { status: 500 },
      );
    }
    if (!process.env.RESEND_FROM) {
      return NextResponse.json(
        { ok: false, error: "RESEND_FROM not set" },
        { status: 500 },
      );
    }

    // 2) フォント取得
    const origin = getOrigin(req);
    const fontUrl = `${origin}/fonts/NotoSansJP-Regular.ttf`;
    let fontBytes;
    try {
      const fr = await fetch(fontUrl, { cache: "no-store" });
      if (!fr.ok) throw new Error(`fetch font failed: ${fr.status}`);
      const ab = await fr.arrayBuffer();
      fontBytes = new Uint8Array(ab);
    } catch (e) {
      return NextResponse.json(
        { ok: false, error: `font fetch error: ${String(e)}`, fontUrl },
        { status: 500 },
      );
    }

    // 3) PDF生成→Base64
    let pdfBase64 = "";
    try {
      const pdfBuf = await makePlanPdf({ email: to, title, plan, fontBytes });
      pdfBase64 = pdfBuf.toString("base64");
    } catch (e) {
      return NextResponse.json(
        { ok: false, error: `pdf build error: ${String(e)}` },
        { status: 500 },
      );
    }

    // 4) Resend 呼び出し
    const payload = {
      from: process.env.RESEND_FROM,     // 例: "noreply@ai-digital-lab.com"
      to: [to],
      subject: `${title}（PDF添付）`,
      text: [
        "ご購入ありがとうございます。",
        "AIヘルス週次プランのPDFを添付しています。",
        "ご確認ください。",
      ].join("\n"),
      attachments: [
        { filename: "health-plan.pdf", content: pdfBase64, contentType: "application/pdf" },
      ],
    };

    const result = await resendEmail(payload);
    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "resend error",
          status: result.status,
          response: result.json || result.raw || null,
        },
        { status: 502 },
      );
    }

    const id = result.json?.id ?? null;
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    // 最後の砦：常にJSONで返す
    return NextResponse.json(
      { ok: false, error: String(e?.message || e) },
      { status: 500 },
    );
  }
}
