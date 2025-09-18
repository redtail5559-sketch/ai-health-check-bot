// app/api/stripe-webhook/route.js
export const runtime = "nodejs";           // ★Stripe検証は raw body 必須 → nodejs ランタイム
export const dynamic = "force-dynamic";    // キャッシュ無効化

import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20", // ここはあなたのStripeダッシュボードのバージョンでOK
});

export async function POST(req) {
  // 署名ヘッダーを取得
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  // raw body を文字列として取得 → Buffer化して検証
  const rawBody = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      Buffer.from(rawBody, "utf8"),
      signature,
      process.env.STRIPE_WEBHOOK_SECRET // ★Vercel環境変数に設定
    );
  } catch (err) {
    console.error("[WEBHOOK] Signature verification failed:", err?.message);
    return NextResponse.json({ error: `Invalid signature: ${err?.message}` }, { status: 400 });
  }

  try {
    // 必要なイベントだけをハンドリング
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;

        // 例) 商品明細が必要なら以下で取得可能
        // const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });

        // ここであなたの処理（DB書き込み / PDF生成キュー投入 / Resendでメール送信 など）
        // 例: console.log("paid session:", session.id, session.customer_details?.email);

        break;
      }

      case "invoice.paid": {
        // 定期課金などを使う場合
        break;
      }

      case "invoice.payment_failed": {
        // 失敗アクション（通知など）
        break;
      }

      default: {
        // 未ハンドルはログだけ
        console.log(`[WEBHOOK] Unhandled event: ${event.type}`);
      }
    }

    // Stripeへ 2xx を返せばOK（ボディは任意）
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error("[WEBHOOK] Handler error:", err);
    // ここで 500 を返すと Stripe は後で自動リトライしてくれます
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }
}
