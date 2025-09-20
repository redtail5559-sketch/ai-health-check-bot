// app/api/create-checkout-session/route.js
export const runtime = "nodejs";

import Stripe from "stripe";
import { NextResponse, NextRequest } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });

export async function POST(req /** @type {NextRequest} */) {
  try {
    const body = await req.json();

    // origin を安全に決定（env 未設定でも動く）
    const referer = req.headers.get("referer") || "";
    const url = new URL(referer || process.env.NEXT_PUBLIC_BASE_URL || "https://ai-health-check-bot.vercel.app");
    const origin = `${url.protocol}//${url.host}`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "jpy",
            product_data: { name: "AI健康診断レポート (PDF付)" },
            unit_amount: 500, // ← ¥500
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/pro/success?sid={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pro/cancel`,
      client_reference_id: body.email || undefined,
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
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (e) {
    console.error("[create-checkout-session] error:", e);
    // ← これがフロントの alert にそのまま表示されます
    return new NextResponse(String(e?.message || e), { status: 400 });
  }
}
