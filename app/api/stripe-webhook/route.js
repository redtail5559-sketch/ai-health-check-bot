// app/api/stripe-webhook/route.js
export const runtime = "nodejs";           // Stripe検証は raw body 必須 → nodejs ランタイム
export const dynamic = "force-dynamic";    // キャッシュ無効化

import { NextResponse } from "next/server";
import Stripe from "stripe";

// Stripeクライアント初期化
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20", // StripeダッシュボードのAPIバージョンに合わせてください
});

// 環境に応じて Webhook Secret を切り替え
// NODE_ENV が "production" のときは本番用、それ以外はテスト用を利用
const webhookSecret =
  process.env.NODE_ENV === "production"
    ? process.env.STRIPE_WEBHOOK_SECRET
    : process.env.STRIPE_WEBHOOK_SECRET_TEST;

export async function POST(req) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const rawBody = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      Buffer.from(rawBody, "utf8"),
      signature,
      webhookSecret
    );
  } catch (err) {
    console.error("[WEBHOOK] Signature verification failed:", err?.message);
    return NextResponse.json({ error: `Invalid signature: ${err?.message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;

        // --- 本番用処理例 ---
        // 1. DBに注文情報を保存
        await saveOrderToDatabase(session);

        // 2. PDF生成処理をキューに投入
        await enqueuePdfGeneration(session);

        // 3. メール送信処理
        await sendConfirmationEmail(session.customer_details?.email);

        console.log("[WEBHOOK] Checkout completed:", session.id, session.customer_details?.email);
        break;
      }

      case "invoice.paid": {
        // 定期課金処理など
        console.log("[WEBHOOK] Invoice paid");
        break;
      }

      case "invoice.payment_failed": {
        // 支払い失敗時の処理
        console.log("[WEBHOOK] Invoice payment failed");
        break;
      }

      default: {
        console.log(`[WEBHOOK] Unhandled event: ${event.type}`);
      }
    }

    // Stripeへ 2xx を返せばOK
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error("[WEBHOOK] Handler error:", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }
}

// 他のメソッドは拒否（405エラー回避）
export function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
export function PUT() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
export function DELETE() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}

// preview test comment