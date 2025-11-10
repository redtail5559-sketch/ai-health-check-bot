// app/api/create-session/route.js
import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_TEST);

export async function POST(req) {
  try {
    const body = await req.json();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: body.items,
      success_url: `http://localhost:3000/pro/result?sessionId={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:3000/pro/cancel`,
    });

    console.log("生成されたセッションID:", session.id);
    return NextResponse.json({ ok: true, sessionId: session.id });
  } catch (e) {
    console.error("Stripeセッション作成エラー:", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}