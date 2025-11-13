// app/api/pro-success/route.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import Stripe from "stripe";

// 環境に応じてキーを切り替え
const isProduction = process.env.NODE_ENV === "production";
const stripeSecretKey = isProduction
  ? process.env.STRIPE_SECRET_KEY
  : process.env.STRIPE_SECRET_KEY_TEST;

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
        { day: "月", activity: "ウォーキング 30分" },
        { day: "火", activity: "筋トレ（上半身）" },
        { day: "水", activity: "休息" },
        { day: "木", activity: "ジョギング 20分" },
        { day: "金", activity: "筋トレ（下半身）" },
        { day: "土", activity: "ヨガ 30分" },
        { day: "日", activity: "休息" },
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