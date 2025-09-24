// app/api/pro-result/route.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
const DAYS = ["月","火","水","木","金","土","日"];

function bmi(heightCm, weightKg) {
  const h = Number(heightCm) / 100;
  if (!h || !weightKg) return null;
  return Math.round((Number(weightKg) / (h * h)) * 10) / 10;
}

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const sessionId = url.searchParams.get("sessionId") || "";
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

    // ===== ここで必ず AI プラン API を叩く =====
    const origin = url.origin;
    const seed = Math.random().toString(36).slice(2); // 毎回ゆらぐ
    let usedAiPlan = false;
    let weekPlan = [];
    let aiSummary = "";
    let aiError = null;

    try {
      const aiRes = await fetch(`${origin}/api/ai-plan?t=${Date.now()}&seed=${seed}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          sessionId,
          inputs: { profile, goals, bmi: bmiVal, seed },
        }),
      });

      const aiJson = await aiRes.json();
      if (!aiRes.ok) throw new Error(aiJson?.error || `ai-plan HTTP ${aiRes.status}`);

      const plan = aiJson?.plan || {};
      const days = ["月","火","水","木","金","土","日"];
      const week = Array.isArray(plan.week) ? plan.week : [];

      weekPlan = days.map((d, i) => {
        const src = week[i] || {};
        const m = src.meals || {};
        const w = src.workout || {};
        return {
          day: `${d}曜日`,
          meals: {
            breakfast: m.breakfast || "和定食（ご飯少なめ）",
            lunch:     m.lunch     || "鶏むね丼",
            dinner:    m.dinner    || "豆腐と野菜炒め",
            snack:     m.snack     || "なし",
          },
          workout: {
            name:     w.menu || "早歩き",
            minutes:  Number.isFinite(w.durationMin) ? w.durationMin : 20,
            intensity:"中",
            tips:     w.notes || "余裕があれば体幹トレ各30秒×2",
          },
        };
      });

      aiSummary = plan?.profile?.summary || "";
      usedAiPlan = true;
    } catch (e) {
      aiError = String(e?.message || e);
      // フォールバック（テンプレ）
      const mid  = { name: "早歩き＋自重筋トレ", minutes: 40, intensity: "中", tips: "スクワット10×3など" };
      const easy = { name: "ストレッチ＋散歩",   minutes: 20, intensity: "低", tips: "寝る前10分ストレッチ" };
      const baseMeals = {
        breakfast: "和定食（ごはん少なめ）",
        lunch:     "サーモン丼（小盛）",
        dinner:    "豆腐ハンバーグ＋サラダ＋スープ",
        snack:     "きなこヨーグルト",
      };
      weekPlan = DAYS.map((d, i) => ({
        day: `${d}曜日`,
        meals: { ...baseMeals },
        workout: i === 2 || i === 6 ? easy : mid,
      }));
    }

    const data = {
      sessionId,
      email: session?.customer_details?.email || md.email || "",
      profile,
      bmi: bmiVal,
      overview: aiSummary ? `${overview}\n${aiSummary}` : overview,
      goals,
      weekPlan,
      createdAt: new Date().toISOString(),
      link: `${origin}/pro/result?sessionId=${encodeURIComponent(sessionId)}`,
      __debug: { usedAiPlan, aiError, seed }, // ← 画面で見えるように返す
    };

    console.log("[pro-result] usedAiPlan:", usedAiPlan, "aiError:", aiError);
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (e) {
    console.error("[pro-result] error:", e);
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
