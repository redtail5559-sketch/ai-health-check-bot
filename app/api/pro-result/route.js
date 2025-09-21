// app/api/pro-result/route.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });

function bmi(heightCm, weightKg) {
  const h = Number(heightCm) / 100;
  if (!h || !weightKg) return null;
  return Math.round((Number(weightKg) / (h * h)) * 10) / 10;
}

const DAYS = ["月", "火", "水", "木", "金", "土", "日"];

function buildWeekPlan(profile) {
  const { diet = "", activity = "" } = profile;

  const lean = {
    breakfast: "オートミール＋ヨーグルト＋バナナ",
    lunch: "鶏胸肉サラダ＋玄米",
    dinner: "鮭の塩焼き＋味噌汁＋野菜",
    snack: "素焼きナッツ or プロテイン",
  };
  const bulk = {
    breakfast: "卵2個＋トースト＋フルーツ",
    lunch: "牛ステーキ150g＋白米",
    dinner: "鶏もも照り焼き＋パスタ小皿＋サラダ",
    snack: "チーズ or ギリシャヨーグルト",
  };
  const balance = {
    breakfast: "和定食（ごはん少なめ）",
    lunch: "サーモン丼（小盛）",
    dinner: "豆腐ハンバーグ＋サラダ＋スープ",
    snack: "ダークチョコ少量 or きなこヨーグルト",
  };

  let baseMeals = balance;
  if (diet.includes("減量")) baseMeals = lean;
  if (diet.includes("増量")) baseMeals = bulk;

  const low = { name: "ウォーキング", minutes: 30, intensity: "低〜中", tips: "会話できる速度でOK" };
  const mid = { name: "早歩き＋自重筋トレ", minutes: 40, intensity: "中", tips: "スクワット10×3など" };
  const hi  = { name: "有酸素＋筋トレ", minutes: 50, intensity: "中〜高", tips: "有酸素30分＋筋トレ20分" };

  let w = mid;
  if (activity.includes("低い")) w = low;
  if (activity.includes("高い")) w = hi;

  const easy = { name: "ストレッチ＋散歩", minutes: 20, intensity: "低", tips: "寝る前10分ストレッチ" };

  const week = [];
  for (let i = 0; i < 7; i++) {
    const isRecovery = i === 2 || i === 6; // 水・日
    week.push({
      day: `${DAYS[i]}曜日`,
      meals: { ...baseMeals },
      workout: isRecovery ? easy : w,
    });
  }
  return week;
}

export async function GET(req) {
  try {
    const { searchParams, origin } = new URL(req.url);
    const sessionId = searchParams.get("sessionId") || "";
    if (!sessionId) return NextResponse.json({ ok: false, error: "missing sessionId" }, { status: 400 });

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const md = session?.metadata || {};

    const profile = {
      heightCm: md.heightCm || "",
      weightKg: md.weightKg || "",
      age: md.age || "",
      sex: md.sex || "",
      activity: md.activity || "",
      sleep: md.sleep || "",
      drink: md.drink || "",
      smoke: md.smoke || "",
      diet: md.diet || "",
    };

    const bmiVal = bmi(profile.heightCm, profile.weightKg);
    const overview = (() => {
      if (!bmiVal) return "入力値から全体傾向を評価しました。無理なく続けられる内容に調整しています。";
      if (bmiVal < 18.5) return `BMIは${bmiVal}。やせ傾向。タンパク質と睡眠を確保しつつ計画的に増量を。`;
      if (bmiVal < 25)   return `BMIは${bmiVal}。標準。姿勢・筋力・体力の底上げを狙いましょう。`;
      return `BMIは${bmiVal}。やや高め。食事の質と量を整え、有酸素＋筋トレで代謝を上げる方針を。`;
    })();

    const goals = [
      "毎日同じ時間に寝起きして体内時計を整える",
      "タンパク質を毎食20g目安（手のひら1枚）",
      "平日3日＋週末いずれか1日、計4日はアクティブに動く",
    ];

    const data = {
      sessionId,
      email: session?.customer_details?.email || md.email || "",
      profile,
      bmi: bmiVal,
      overview,
      goals,
      weekPlan: buildWeekPlan(profile),
      createdAt: new Date().toISOString(),
      link: `${origin}/pro/result?sessionId=${encodeURIComponent(sessionId)}`,
    };

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (e) {
    console.error("[pro-result] error:", e);
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
