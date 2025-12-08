export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import Stripe from "stripe";

// ✅ 正しい production チェックとキーの切り替え
const isProd = process.env.NEXT_PUBLIC_ENV === "production";
const stripeSecretKey = isProd
  ? process.env.STRIPE_SECRET_KEY
  : process.env.STRIPE_SECRET_KEY_TEST;

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2024-06-20",
});

export async function POST(req) {
  try {
    const body = await req.json();
    console.log("✅ 受信した goals:", body.goals);

    const email = body.email?.trim() || "";
    const goals = Array.isArray(body.goals) ? body.goals : [];

    // ✅ メールアドレスのバリデーション
    if (!email || !email.includes("@") || email.length < 5) {
      return NextResponse.json(
        { error: "Invalid email address: メールアドレスを正しく入力してください。" },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price: isProd
            ? process.env.STRIPE_PRICE_ID
            : process.env.STRIPE_PRICE_ID_TEST,
          quantity: 1,
        },
      ],
      success_url: `${req.headers.get("origin")}/pro/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/pro/cancel`,
      billing_address_collection: "auto",
      locale: "ja",
      customer_email: email,
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
        goals: goals.join(","),
        email: email,
      },
    });

    console.log("✅ Stripe session:", session);

    return NextResponse.json({ checkouturl: session.url });
  } catch (e) {
    console.error("[checkout] error:", e);
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}