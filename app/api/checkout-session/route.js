// app/api/checkout/route.js
export const runtime = "nodejs";
import Stripe from "stripe";
import { NextResponse } from "next/server";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const { email } = await req.json().catch(() => ({})); // ← フロントから受け取る
    const origin =
      process.env.NEXT_PUBLIC_APP_ORIGIN || "https://ai-health-check-bot.vercel.app";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      customer_email: email || undefined, // ← ここがポイント（自動表示）
      success_url: `${origin}/pro/result?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pro/cancel`,
      locale: "ja",
    });

    return NextResponse.json({ id: session.id, url: session.url });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
