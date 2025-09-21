// app/api/pro-result/route.js
export const runtime = "nodejs";

import Stripe from "stripe";
import { NextResponse } from "next/server";

// STRIPE_SECRET_KEY は sk_test_...（テストキー）を設定しておいてください
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId") || "";
    if (!sessionId) {
      return NextResponse.json({ ok: false, error: "missing sessionId" }, { status: 400 });
    }

    // Stripe の Checkout セッションを取得（metadata にフォーム内容が入っている想定）
    const s = await stripe.checkout.sessions.retrieve(sessionId);
    const m = s.metadata || {};

    // 簡易レポート生成（必要に応じてロジックを拡張）
    const h = Number(m.heightCm || 0);
    const w = Number(m.weightKg || 0);
    const bmi = h && w ? w / ((h / 100) ** 2) : null;

    const data = {
      sessionId,
      email: m.email || s.customer_details?.email || "",
      profile: {
        heightCm: m.heightCm,
        weightKg: m.weightKg,
        age: m.age,
        sex: m.sex,
        activity: m.activity,
        sleep: m.sleep,
        drink: m.drink,
        smoke: m.smoke,
        diet: m.diet,
      },
      overview: bmi
        ? `BMIは ${bmi.toFixed(1)}。${
            bmi >= 25
              ? "減量を検討しましょう。"
              : bmi < 18.5
              ? "やせ気味です。栄養補給を心がけて。"
              : "バランス良好です。"
          }`
        : "BMIを算出できませんでした。",
      goals: [
        "週150分の有酸素運動を目標にする",
        "毎食に野菜を一皿プラス",
        "就寝1時間前はノーカフェイン",
      ],
      weekPlan: [
        {
          day: "月",
          meals: {
            breakfast: "オートミール+ヨーグルト",
            lunch: "鶏胸サラダ",
            dinner: "鮭・玄米・味噌汁",
            snack: "素焼きナッツ",
          },
          workout: { name: "早歩き", minutes: 30, intensity: "中等度", tips: "姿勢を意識" },
        },
        {
          day: "火",
          meals: {
            breakfast: "卵+トースト",
            lunch: "そば",
            dinner: "豆腐ハンバーグ",
            snack: "バナナ",
          },
          workout: { name: "スクワット", minutes: 15, intensity: "軽め", tips: "呼吸を止めない" },
        },
      ],
    };

    return NextResponse.json({ ok: true, data });
  } catch (e) {
    console.error("[pro-result] error:", e);
    return NextResponse.json({ ok: false, error: "result generation failed" }, { status: 500 });
  }
}
