// app/api/create-checkout-session/route.js
export const runtime = "nodejs";

import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });

export async function POST(req) {
  try {
    const body = await req.json();

    // origin を安全に決める（環境変数が空でも動くように）
    const headersList = req.headers;
    const referer = headersList.get("referer") || "";
    const url = new URL(referer || process.env.NEXT_PUBLIC_BASE_URL || "https://ai-health-check-bot.vercel.app");
    const origin = `${url.protocol}//${url.host}`;

    // ★JPYはゼロ小数。¥500なら 500
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "jpy",
            product_data: { name: "AI健康診断レポート (PDF付)" },
            unit_amount: 500, // ← 金額調整
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/pro/success?sid={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pro/cancel`,
      metadata: {
        heightCm: body.heightCm ?? "",
        weightKg: body.weightKg ?? "",
        age: body.age ?? "",
        sex: body.sex ?? "",
        drink: body.drink ?? "",
        smoke: body.smoke ?? "",
        activity: body.activity ?? "",
        sleep: body.sleep ?? "",
        diet: body.diet ?? "",
        email: body.email ?? "",
      },
      client_reference_id: body.email || undefined,
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (e) {
    console.error("[create-checkout-session] error:", e);
    // エラーメッセージをそのまま返して、フロントのalertに表示
    return new NextResponse(String(e?.message || e), { status: 400 });
  }
}
