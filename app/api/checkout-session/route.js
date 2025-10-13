// app/api/checkout-session/route.js
import Stripe from "stripe";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

// ここでサーバー側のフォールバック価格IDを読む（Vercelに設定）
const DEFAULT_PRICE_ID =
  process.env.STRIPE_PRICE_ID || process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || "";

function originFromHeaders() {
  const h = headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  const proto = h.get("x-forwarded-proto") || "https";
  return host ? `${proto}://${host}` : process.env.NEXT_PUBLIC_SITE_URL || "";
}

export async function POST(req) {
  try {
    const { priceId, email } = await req.json();

    // priceId が来ていなければ環境変数のデフォルトを使用
    const resolvedPriceId = (priceId || DEFAULT_PRICE_ID || "").trim();
    if (!resolvedPriceId) {
      return NextResponse.json(
        { ok: false, error: "priceId is required (set STRIPE_PRICE_ID on server or pass in body)" },
        { status: 400 }
      );
    }

    const origin = originFromHeaders();
    const safeEmail = typeof email === "string" ? email.trim() : "";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: resolvedPriceId, quantity: 1 }],
      // ★ 決済成功後にメールをクエリで持って /pro/result へ戻す
      success_url: `${origin}/pro/result?email=${encodeURIComponent(
        safeEmail
      )}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pro`,
      ...(safeEmail ? { customer_email: safeEmail } : {}),
      allow_promotion_codes: true,
    });

    return NextResponse.json({ ok: true, id: session.id, url: session.url });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: String(e?.message || e) },
      { status: 500 }
    );
  }
}
