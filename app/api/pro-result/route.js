export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import Stripe from "stripe";

console.log("STRIPE_SECRET_KEY_TEST:", process.env.STRIPE_SECRET_KEY_TEST);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_TEST, { apiVersion: "2024-06-20" });

const toNum = (v) => (v == null ? null : Number(v));
const clean = (s) => (typeof s === "string" ? s.replace(/\$/g, "").trim() : s);
function bmi(heightCm, weightKg) {
  const h = Number(heightCm) / 100;
  if (!h || !weightKg) return null;
  return Math.round((Number(weightKg) / (h * h)) * 10) / 10;
}
const DAYS = ["月","火","水","木","金","土","日"];

async function createWeekPlanAI(profile, seed) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is missing");

  const schema = { /* 省略：元のままでOK */ };

  const sys = `...`.trim();
  const user = `...`.trim();

  const body = { /* 省略：元のままでOK */ };

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`OpenAI ${resp.status}: ${t}`);
  }

  const data = await resp.json();
  let content = data?.choices?.[0]?.message?.content || "{}";
  console.log("OpenAIの生出力:", content);
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (e) {
    throw new Error("AI JSON parse failed");
  }
  return parsed;
}

function fallbackWeekPlan(profile) { /* 省略：元のままでOK */ }

export async function GET(req) {
  try {
    const { searchParams, origin } = new URL(req.url);
    const sessionId = searchParams.get("sessionId") || "";

    console.log("🔍 sessionId received:", sessionId);

    if (!sessionId || !sessionId.startsWith("cs_")) {
      console.warn("⚠️ Invalid or missing sessionId:", sessionId);
      return NextResponse.json({ ok: false, error: "missing or invalid sessionId" }, { status: 400 });
    }

    let session;
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId);
      console.log("✅ Stripe session retrieved:", session?.id);
    } catch (stripeErr) {
      console.error("❌ Stripe session retrieval failed:", stripeErr.message, "sessionId:", sessionId);
      return NextResponse.json({ ok: false, error: "Stripe session not found" }, { status: 404 });
    }

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

    let planJson, usedAi = false, aiError = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const out = await createWeekPlanAI({ ...profile, seed: `${sessionId}-${Date.now()}` }, `${sessionId}-${Date.now()}`);
        planJson = out;
        usedAi = true;
        break;
      } catch (e) {
        aiError = String(e?.message || e);
      }
    }
    if (!planJson) planJson = fallbackWeekPlan(profile);

    const weekPlan = (planJson?.week || []).slice(0, 7).map((d, i) => {
      const obj = {
        day: d?.day || `${DAYS[i]}曜日`,
        meals: {
          breakfast: clean(d?.meals?.breakfast || ""),
          lunch:     clean(d?.meals?.lunch || ""),
          dinner:    clean(d?.meals?.dinner || ""),
          snack:     clean(d?.meals?.snack || ""),
        },
        workout: {
          name:    clean(d?.workout?.name || "早歩き"),
          minutes: toNum(d?.workout?.minutes) || (i === 2 || i === 6 ? 20 : 40),
          tips:    clean(d?.workout?.tips || (i === 2 || i === 6 ? "寝る前10分ストレッチ" : "スクワット10×3など")),
        },
      };
      console.log("整形中の1日分:", obj);
      return obj;
    });

    while (weekPlan.length < 7) {
      weekPlan.push({
        day: `${DAYS[weekPlan.length]}曜日`,
        meals: { breakfast: "", lunch: "", dinner: "", snack: "" },
        workout: { name: "早歩き", minutes: 30, tips: "" },
      });
    }

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
      weekPlan,
      createdAt: new Date().toISOString(),
      link: `${origin}/pro/result?sessionId=${encodeURIComponent(sessionId)}`,
      __debug: { usedAiPlan: usedAi, aiError, seed: `${sessionId}-${Date.now()}` },
    };

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (e) {
    console.error("[pro-result] error:", e);
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}