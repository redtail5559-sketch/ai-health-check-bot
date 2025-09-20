// app/api/checkout/route.js
export const runtime = "nodejs"; // Stripe SDK は Node 実行が安全

import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    // もし数量やメタ情報を受け取りたい場合はここで req.json() を読む
    const appOrigin =
      process.env.NEXT_PUBLIC_APP_ORIGIN || "https://ai-health-check-bot.vercel.app";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID, // ← StripeのPrice ID
          quantity: 1,
        },
      ],
      // ★ ここが今回の要点
      success_url: `${appOrigin}/pro/success?sid={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appOrigin}/pro/cancel`,

      // 任意
      billing_address_collection: "auto",
      locale: "ja",
    });

    return NextResponse.json({ id: session.id, url: session.url });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
