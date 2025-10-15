// app/api/pdf-email/route.js
import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export const runtime = "nodejs";
const RESEND_API_URL = "https://api.resend.com/emails";

// --- ① 簡易PDFを生成する（引数の情報でPDF化）
async function makePlanPdf({ email, title = "AIヘルス週次プラン", plan = [] }) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]); // A4
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const { width, height } = page.getSize();

  const draw = (text, x, y, size = 12, color = rgb(0, 0, 0)) => {
    page.drawText(String(text ?? ""), { x, y, size, font, color });
  };

  // ヘッダー
  draw(title, 40, height - 60, 20);
  draw(`送付先: ${email}`, 40, height - 90, 10, rgb(0.2, 0.2, 0.2));

  // コンテンツ（サンプル: 7日分）
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
      // 足りなくなったら次ページ
      const page2 = pdf.addPage([595.28, 841.89]);
      page2.drawText("続き", { x: 40, y: 800, size: 12, font });
      y = 770;
    } else {
      draw(`• ${line}`, 48, y, 12);
      y -= 18;
    }
  }

  const bytes = await pdf.save(); // Uint8Array
  return Buffer.from(bytes);      // NodeのBufferとして返す
}

// --- 診断: 環境と送信先を確認
export async function GET(req) {
  const email = new URL(req.url).searchParams.get("email") || "";
  return NextResponse.json({
    ok: true,
    diag: {
      email,
      hasKey: !!process.env.RESEND_API_KEY,
      from: process.env.RESEND_FROM || "",
    },
  });
}

// --- 送信: POST { email, title?, plan?[] }
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const to = (body?.email || "").trim();
    const title = (body?.title || "AIヘルス週次プラン");
    const plan = Array.isArray(body?.plan) ? body.plan : [];

    if (!to) return NextResponse.json({ ok: false, error: "email is required" }, { status: 400 });
    if (!process.env.RESEND_API_KEY) return NextResponse.json({ ok: false, error: "RESEND_API_KEY not set" }, { status: 500 });
    if (!process.env.RESEND_FROM) return NextResponse.json({ ok: false, error: "RESEND_FROM not set" }, { status: 500 });

    // ② PDF生成 → Base64
    const pdfBuf = await makePlanPdf({ email: to, title, plan });
    const pdfBase64 = pdfBuf.toString("base64");

    // ③ Resend REST API で送信（添付あり）
    const r = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM,   // 例: "noreply@ai-digital-lab.com"
        to: [to],
        subject: `${title}（PDF添付）`,
        text:
`ご購入ありがとうございます。
AIヘルス週次プランのPDFを添付しています。
ご確認ください。`,
        attachments: [
          {
            filename: "health-plan.pdf",
            content: pdfBase64,                     // Base64文字列
            contentType: "application/pdf",         // 任意（あると親切）
          },
        ],
      }),
    });

    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      return NextResponse.json({ ok: false, status: r.status, error: data?.message || JSON.stringify(data) }, { status: 500 });
    }
    return NextResponse.json({ ok: true, id: data?.id || null });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
