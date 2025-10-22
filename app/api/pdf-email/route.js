// app/api/pdf-email/route.js
import { NextResponse } from "next/server";
import { PDFDocument, rgb } from "pdf-lib";
import * as fontkit from "fontkit";


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

  const jpFont = await pdf.embedFont(fontBytes, { subset: true });

  // 画像読み込み
  const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const iconBytes = await fetch(`${origin}/ai-robot.png`).then(r => r.arrayBuffer());
  const logoBytes = await fetch(`${origin}/logo.png`).then(r => r.arrayBuffer());
  const iconImage = await pdf.embedPng(iconBytes);
  const logoImage = await pdf.embedPng(logoBytes);

  const pageSize = [595.28, 841.89]; // A4
  let page = pdf.addPage(pageSize);
  const { width, height } = page.getSize();

  const draw = (text, x, y, size = 12, color = rgb(0, 0, 0)) => {
    page.drawText(String(text ?? ""), { x, y, size, font: jpFont, color });
  };

  const drawLine = (x1, y1, x2, y2, thickness = 0.5) => {
    page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness });
  };

  // ヘッダー画像とタイトル
  page.drawImage(iconImage, { x: 40, y: height - 60, width: 32, height: 32 });
  page.drawImage(logoImage, { x: width - 120, y: height - 60, width: 80, height: 32 });
  draw(title + "　食事とワークアウトの7日メニュー", 80, height - 60, 14);
  draw(`送付先: ${email}`, 80, height - 80, 10, rgb(0.3, 0.3, 0.3));

  // 表形式描画
  const headers = ["曜日", "朝食", "昼食", "夕食", "間食", "運動", "Tips"];
  const colWidths = [50, 80, 80, 80, 60, 80, 100];
  const startX = 40;
  let y = height - 120;

  const drawHeaderRow = () => {
    let x = startX;
    const rowHeight = 16;

    // 背景色（薄いピンク）
    page.drawRectangle({
      x: startX,
      y: y - 2,
      width: colWidths.reduce((a, b) => a + b, 0),
      height: rowHeight,
      color: rgb(1, 0.9, 0.9),
    });

    headers.forEach((text, i) => {
      draw(text, x + 4, y + 2, 10);
      drawLine(x, y, x, y - rowHeight); // 縦線
      x += colWidths[i];
    });
    drawLine(startX, y, x, y); // 上線
    drawLine(startX, y - rowHeight, x, y - rowHeight); // 下線
    y -= rowHeight;
  };

  const drawDataRow = (values) => {
    let x = startX;
    const rowHeight = 16;
    values.forEach((text, i) => {
      draw(String(text ?? ""), x + 4, y + 2, 9);
      drawLine(x, y, x, y - rowHeight); // 縦線
      x += colWidths[i];
    });
    drawLine(startX, y - rowHeight, x, y - rowHeight); // 下線
    y -= rowHeight;
  };

  drawHeaderRow();

  for (const row of plan) {
    if (y < 80) {
      page = pdf.addPage(pageSize);
      y = height - 60;
      drawHeaderRow();
    }
    const values = [
      row.day,
      row.meals?.breakfast,
      row.meals?.lunch,
      row.meals?.dinner,
      row.meals?.snack,
      `${row.workout?.name}（${row.workout?.minutes}分）`,
      row.workout?.tips,
    ];
    drawDataRow(values);
  }

  // フッター
  draw("Powered by AI Digital Lab", startX, 40, 10, rgb(0.4, 0.4, 0.4));

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
    const fontUrl = "https://fonts.gstatic.com/s/notosansjp/v52/-F6ofjtqLzI2JPCgQBnw7HFQogg.woff2";
    let fontBytes;
    try {
  const fr = await fetch(fontUrl, { cache: "no-store" });
  if (!fr.ok) throw new Error(`fetch font failed: ${fr.status}`);
  const ab = await fr.arrayBuffer();
  fontBytes = new Uint8Array(ab);
} catch (e) {
  console.error("フォント取得失敗:", e);
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
