// app/api/checkout-session/route.js
import Stripe from "stripe";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

function originFromHeaders() {
  const h = headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  const proto = h.get("x-forwarded-proto") || "https";
  return host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_APP_ORIGIN || "");
}

export async function POST(req) {
  try {
    let body = {};
    try { body = await req.json(); } catch {} // 空ボディでもOKにする

    const safeEmail = typeof body?.email === "string" ? body.email.trim() : "";
    const envPrice = (process.env.STRIPE_PRICE_ID || "").trim();
    const priceId = (body?.priceId || envPrice || "").trim();

    if (!priceId) {
      return NextResponse.json(
        { ok: false, error: "Missing STRIPE_PRICE_ID on server and priceId not provided" },
        { status: 500 }
      );
    }

    const origin = originFromHeaders();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/pro/result?email=${encodeURIComponent(safeEmail)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pro`,
      ...(safeEmail ? { customer_email: safeEmail } : {}),
      allow_promotion_codes: true,
    });

    return NextResponse.json({ ok: true, id: session.id, url: session.url });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
