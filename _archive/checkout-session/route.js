import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req) {
  try {
    const body = await req.json();
    const email = (body.email || "").trim();

    if (!email) {
      return NextResponse.json(
        { ok: false, error: "メールアドレスが未入力です" },
        { status: 400 }
      );
    }

    // ✅ Stripe環境切り替え
    const mode = process.env.STRIPE_ENV || "test";

    const stripeKey =
      mode === "live"
        ? process.env.STRIPE_SECRET_KEY_LIVE
        : process.env.STRIPE_SECRET_KEY_TEST;

    const priceId =
      mode === "live"
        ? process.env.STRIPE_PRICE_ID_LIVE
        : process.env.STRIPE_PRICE_ID_TEST;

    const stripe = new Stripe(stripeKey);

    const origin = req.headers.get("origin") || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: email,
      success_url: `${origin}/pro/result?sessionId={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pro?cancel=true`,
    });

    // ✅ session.id を返すことでクライアント側で Checkout URL を構築可能
    return NextResponse.json({ ok: true, sessionId: session.id });
  } catch (err) {
    console.error("Stripeエラー:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "決済セッション作成に失敗しました" },
      { status: 500 }
    );
  }
}