// app/api/pro-success/route.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import Stripe from "stripe";

const isProd = process.env.NEXT_PUBLIC_ENV === "production";
const stripeSecretKey = isProd
  ? process.env.STRIPE_SECRET_KEY
  : process.env.STRIPE_SECRET_KEY_TEST;

console.log("✅ stripe key used:", stripeSecretKey);

const stripe = new Stripe(stripeSecretKey);

export async function GET(req) {
  const url = new URL(req.url);
  const sid =
    url.searchParams.get("session_id") ||
    url.searchParams.get("sessionId") ||
    url.searchParams.get("sid") ||
    "";

  if (!sid || !sid.startsWith("cs_")) {
    return NextResponse.json(
      { ok: false, error: "session_id が無効です" },
      { status: 400 }
    );
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sid, {
      expand: ["customer"],
    });

    const data = {
      email: session.customer_details?.email || "unknown@example.com",
      bmi: 22.5,
      overview: "あなたは健康的な体型です。",
      goals: ["体脂肪率を下げる", "筋力を維持する"],
      weekPlan: [
        {
          day: "月",
          meals: {
            breakfast: "トーストと卵",
            lunch: "鶏むね肉と野菜",
            dinner: "魚と味噌汁",
            snack: "ナッツ",
          },
          workout: {
            name: "ウォーキング",
            minutes: 30,
            tips: "朝の涼しい時間に行いましょう",
          },
        },
        {
          day: "火",
          meals: {
            breakfast: "ヨーグルトとバナナ",
            lunch: "豚肉とキャベツ炒め",
            dinner: "豆腐と野菜スープ",
            snack: "プロテインバー",
          },
          workout: {
            name: "筋トレ（上半身）",
            minutes: 40,
            tips: "フォームを意識してゆっくり行う",
          },
        },
        // 以下略（同様の構造で水〜日を追加可能）
      ],
    };

    return NextResponse.json({ ok: true, data });
  } catch (e) {
    console.error("❌ Stripeセッション取得エラー:", e);
    return NextResponse.json(
      { ok: false, error: "Stripeセッション取得に失敗しました" },
      { status: 500 }
    );
  }
}