export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import Stripe from "stripe";

// ✅ 環境判定でキーとPrice IDを切り替え
const isProd = process.env.NODE_ENV === "production";

const stripe = new Stripe(
  isProd
    ? process.env.STRIPE_SECRET_KEY
    : process.env.STRIPE_SECRET_KEY_TEST,
  { apiVersion: "2024-06-20" }
);

const priceId = isProd
  ? process.env.STRIPE_PRICE_ID
  : process.env.STRIPE_PRICE_ID_TEST;

export async function POST(req) {
  try {
    const body = await req.json();
    const appOrigin =
      process.env.NEXT_PUBLIC_APP_ORIGIN || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${appOrigin}/pro/success?sessionID={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appOrigin}/pro/cancel`,
      billing_address_collection: "auto",
      locale: "ja",
      metadata: {
        heightCm: body.heightCm || "",
        weightKg: body.weightKg || "",
        age: body.age || "",
        sex: body.sex || "",
        activity: body.activity || "",
        sleep: body.sleep || "",
        drink: body.drink || "",
        smoke: body.smoke || "",
        diet: body.diet || "",
        goal: body.goal || "",
        email: body.email || "",
      },
      customer_email: body.email || "",
    });

    console.log("Stripe session:", session); // ✅ ここで session.id を確認

    return NextResponse.json({ checkouturl: session.url });
  } catch (e) {
    console.error("[checkout] error:", e);
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}