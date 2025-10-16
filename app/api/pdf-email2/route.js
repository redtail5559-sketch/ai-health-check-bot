// app/api/pdf-email2/route.js
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit"; // ★ これ必須：pdf-lib で TTF を使うため

const RESEND_API_URL = "https://api.resend.com/emails";

// 現在のオリジン取得（Preview/Prod 両対応）
function getOrigin(req) {
  try {
    const u = new URL(req.url);
    return `${u.protocol}//${u.host}`;
  } catch {
    return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  }
}

/** NotoSansJP を埋め込んで PDF を作る */
async function makePlanPdf({ email, title = "AIヘルス週次プラン", plan = [], fontBytes }) {
  const pdf = await PDFDocument.create();

  // ★ TTF を使う前に fontkit を登録
  pdf.registerFontkit(fontkit);

  // 日本語フォントを埋め込み
  const jpFont = await pdf.embedFont(fontBytes, { subset: true });

  const page = pdf.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();

  const draw = (text, x, y, size = 12, color = rgb(0, 0, 0)) => {
    page.drawText(String(text ?? ""), { x, y, size, font: jpFont, color });
  };

  // ヘッダー
  draw(title, 40, height - 60, 20);
  draw(`送付先: ${email}`, 40, height - 90, 10, rgb(0.2, 0.2, 0.2));

  // 本文（サンプル：7日分）
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

  const bytes = await pdf.save();   // Uint8Array
  return Buffer.from(bytes);        // Buffer
}

/** GET: 診断用（環境確認） */
export async function GET(req) {
  const email = new URL(req.url).searchParams.get("email") || "";
  return NextResponse.json({
    ok: true,
    marker: "pdf-email2 send v1",
    diag: {
      email,
      hasKey: !!process.env.RESEND_API_KEY,
      from: process.env.RESEND_FROM || "",
    },
  });
}

/** POST: { email, title?, plan?[] } を受け取り送信 */
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const to = (body?.email || "").trim();
    const title = body?.title || "AIヘルス週次プラン";
    const plan = Array.isArray(body?.plan) ? body.plan : [];

    if (!to) return NextResponse.json({ ok: false, error: "email is required" }, { status: 400 });
    if (!process.env.RESEND_API_KEY) return NextResponse.json({ ok: false, error: "RESEND_API_KEY not set" }, { status: 500 });
    if (!process.env.RESEND_FROM) return NextResponse.json({ ok: false, error: "RESEND_FROM not set" }, { status: 500 });

    // 1) 日本語フォントをロード（絶対URL → ArrayBuffer → Uint8Array）
    const origin = getOrigin(req);
    const fontUrl = `${origin}/fonts/NotoSansJP-Regular.ttf`;
    const fontAB = await fetch(fontUrl).then(r => {
      if (!r.ok) throw new Error(`failed to fetch font: ${r.status}`);
      return r.arrayBuffer();
    });
    const fontBytes = new Uint8Array(fontAB);

    // 2) PDF 生成 → Base64
    const pdfBuf = await makePlanPdf({ email: to, title, plan, fontBytes });
    const pdfBase64 = pdfBuf.toString("base64");

    // 3) Resend で送信
    const r = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM, // 例: "noreply@ai-digital-lab.com"
        to: [to],
        subject: `${title}（PDF添付）`,
        text:
`ご購入ありがとうございます。
AIヘルス週次プランのPDFを添付しています。
ご確認ください。`,
        attachments: [
          { filename: "health-plan.pdf", content: pdfBase64, contentType: "application/pdf" },
        ],
      }),
    });

    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      return NextResponse.json({ ok: false, status: r.status, error: data?.message || JSON.stringify(data) }, { status: 500 });
    }
    return NextResponse.json({ ok: true, id: data?.id || null });
  } catch (e) {
    console.error("pdf-email2 error:", e);
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
