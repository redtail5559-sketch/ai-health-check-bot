// app/api/pdf-email/route.js
export const runtime = "nodejs";

import { NextResponse } from "next/server";

/**
 * Stripe Checkout Session を REST で取得（SDKをトップレベル初期化しないため）
 * Edgeでも動かせる形だが、このファイルは nodejs ランタイムに固定している
 */
async function getCheckoutSession(sessionId) {
  const sk = process.env.STRIPE_SECRET_KEY;
  if (!sk) throw new Error("STRIPE_SECRET_KEY not set");
  const url = `https://api.stripe.com/v1/checkout/sessions/${sessionId}?expand[]=customer_details`;
  const resp = await fetch(url, { headers: { Authorization: `Bearer ${sk}` } });
  if (!resp.ok) throw new Error(`Stripe error: ${await resp.text()}`);
  return await resp.json();
}

export async function POST(req) {
  try {
    const { sessionId, html } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }
    if (!html) {
      return NextResponse.json({ error: "html is required" }, { status: 400 });
    }

    // 1) Stripeで支払い検証 & 購入者メールを取得
    const session = await getCheckoutSession(sessionId);
    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 403 });
    }
    const to = session.customer_details?.email || session.customer_email;
    if (!to) {
      return NextResponse.json({ error: "Customer email not found" }, { status: 500 });
    }

    // 2) Resend クライアントを "ハンドラ内" で初期化（トップレベル禁止）
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY || "");
    const from = process.env.RESEND_FROM; // 例: "AI健康診断 <no-reply@ai-digital-lab.com>"

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "RESEND_API_KEY not set" }, { status: 500 });
    }
    if (!from) {
      return NextResponse.json({ error: "RESEND_FROM not set" }, { status: 500 });
    }

    // 3) （例）/public の画像を API 内でだけ読む → Base64 にして埋め込み等に使える
    //    ※使わないならこのブロックは削除してOK
    let logoBase64 = "";
    try {
      const fs = await import("fs/promises");
      const path = (await import("path")).default;
      const logoPath = path.join(process.cwd(), "public", "illustrations", "ai-robot.png");
      const buf = await fs.readFile(logoPath);
      logoBase64 = `data:image/png;base64,${buf.toString("base64")}`;

      // 例）html にロゴを差し込みたい場合（任意）
      // html = html.replace("{{LOGO}}", `<img src="${logoBase64}" alt="logo" width="80" />`);
    } catch (e) {
      // ロゴは任意なので失敗しても継続
      console.warn("logo load failed:", e?.message || e);
    }

    // 4) メール送信（まずは HTML を本文として送る）
    const result = await resend.emails.send({
      from,
      to: [to],
      subject: "AI健康診断レポート",
      html, // ※上のロゴ置換を使うなら、置換済み html を使ってください
      // attachments: [...]   // 必要ならここでPDFなどを添付（Base64対応）
    });

    // Resend SDK からの返り値をそのまま返す
    return NextResponse.json({ ok: true, id: result?.data?.id ?? null, to });
  } catch (e) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
