// app/api/checkout-session/route.js
export const runtime = "nodejs";

import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });

export async function POST(req) {
  try {
    const body = await req.json();

    // 必須チェック
    const required = ["heightCm","weightKg","age","sex","activity","sleep","drink","smoke","diet","email"];
    for (const k of required) {
      if (!body?.[k]) return new NextResponse(`missing field: ${k}`, { status: 400 });
    }

    // 呼び出し元のオリジンを推定
    const h = req.headers;
    const origin =
      h.get("origin") ||
      (h.get("referer") ? new URL(h.get("referer")).origin : null) ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      "https://ai-health-check-bot.vercel.app";

    // ✅ 成功時の戻り先に email をクエリで付与して /pro/result へ
    const successUrl = `${origin}/pro/result?email=${encodeURIComponent(body.email)}&sid={CHECKOUT_SESSION_ID}`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "jpy",
            product_data: { name: "AI健康診断レポート (PDF付)" },
            unit_amount: 500, // ¥500
          },
          quantity: 1,
        },
      ],
      // Checkout 画面のメール欄に自動入力
      customer_email: body.email,

      // ここを差し替え
      success_url: successUrl,
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

    // ✅ フロントが扱いやすいように必ずJSONを返す
    return NextResponse.json({ ok: true, url: session.url }, { status: 200 });
  } catch (e) {
    console.error("[checkout-session] error:", e);
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 400 });
  }
}
