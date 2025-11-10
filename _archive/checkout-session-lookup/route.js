// app/api/checkout-session-lookup/route.js
import Stripe from "stripe";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    // 両対応
    const id =
      searchParams.get("session_id") ||
      searchParams.get("sessionId") ||
      searchParams.get("id");
    if (!id) {
      return NextResponse.json({ ok: false, error: "session_id is required" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(id, { expand: ["customer"] });
    const email =
      session?.customer_details?.email ||
      (typeof session?.customer === "object" ? session.customer?.email : "") ||
      "";

    return NextResponse.json({ ok: true, email });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
