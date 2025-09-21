// app/api/checkout-session/route.js
export const runtime = "nodejs";

import Stripe from "stripe";
import { NextResponse } from "next/server";

// STRIPE_SECRET_KEY は sk_test_...（テストキー）を設定しておいてください
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

export async function POST(req) {
  try {
    const body = await req.json();

    // ===== 必須チェック（全フィールド必須） =====
    const required = [
      "heightCm",
      "weightKg",
      "age",
      "sex",
      "activity",
      "sleep",
      "drink",
      "smoke",
      "diet",
      "email",
    ];
    for (const k of required) {
      if (!body?.[k]) {
        return new NextResponse(`missing field: ${k}`, { status: 400 });
      }
    }
    // =======================================

    // success_url / cancel_url の origin を安全に決定（env 未設定時の保険あり）
    const h = req.headers;
    const originHeader = h.get("origin");
    const referer = h.get("referer");
    const base =
      originHeader ||
      (referer ? new URL(referer).origin : null) ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      "https://ai-health-check-bot.vercel.app";
    const origin = new URL(base).origin;

    // ★JPYはゼロ小数：¥500 → unit_amount: 500
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "jpy",
            product_data: { name: "AI健康診断レポート (PDF付)" },
            unit_amount: 500,
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/pro/success?sid={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pro/cancel`,
      client_reference_id: body.email || undefined,
      metadata: {
        heightCm: String(body.heightCm ?? ""),
        weightKg: String(body.weightKg ?? ""),
        age: String(body.age ?? ""),
        sex: String(body.sex ?? ""),
        activity: String(body.activity ?? ""),
        sleep: String(body.sleep ?? ""),
        drink: String(body.drink ?? ""),
        smoke: String(body.smoke ?? ""),
        diet: String(body.diet ?? ""),
        email: String(body.email ?? ""),
      },
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (e) {
    console.error("[checkout-session] error:", e);
    return new NextResponse(String(e?.message || e), { status: 400 });
  }
}
