// app/api/pdf-email/route.js
export const runtime = "nodejs";

import { NextResponse } from "next/server";

import { Resend } from "resend";
import Stripe from "stripe";


// Resend 初期化
const resend = new Resend(process.env.RESEND_API_KEY);

// Stripe 初期化
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2024-06-20",
});




// StripeのCheckout Sessionを取得（Edge対応：RESTで叩く）
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

    if (!sessionId) return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    if (!html)      return NextResponse.json({ error: "html is required" }, { status: 400 });

    // 1) Stripeで支払い検証 & 購入者メールを取得
    const session = await getCheckoutSession(sessionId);
    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 403 });
    }
    const to = session.customer_details?.email || session.customer_email;
    if (!to) return NextResponse.json({ error: "Customer email not found" }, { status: 500 });

    // 2) Resendで送信
    const apiKey = process.env.RESEND_API_KEY;
    const from   = process.env.RESEND_FROM; // 例: "AI健康診断 <no-reply@ai-digital-lab.com>"
    if (!apiKey) return NextResponse.json({ error: "RESEND_API_KEY not set" }, { status: 500 });
    if (!from)   return NextResponse.json({ error: "RESEND_FROM not set" }, { status: 500 });

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],                          // ← サーバーで決定
        subject: "AI健康診断レポート",
        html,                               // まずはHTML本文送信
      }),
    });

    if (!resp.ok) return NextResponse.json({ error: await resp.text() }, { status: resp.status });

    const data = await resp.json().catch(() => ({}));
    return NextResponse.json({ ok: true, id: data?.id ?? null, to });
  } catch (e) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
