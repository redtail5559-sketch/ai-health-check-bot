// app/api/checkout-session/route.js
export const runtime = "nodejs";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const { sessionId } = await req.json();
    if (!sessionId) {
      return new Response("Missing sessionId", { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // 必要な情報だけ返す
    return Response.json({
      email: session.customer_email || "",
      payment_status: session.payment_status,
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
