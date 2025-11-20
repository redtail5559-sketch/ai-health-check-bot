// app/api/pro-success/route.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import Stripe from "stripe";
import OpenAI from "openai";

const isProd = process.env.NEXT_PUBLIC_ENV === "preview";
const stripeSecretKey = isProd
  ? process.env.STRIPE_SECRET_KEY
  : process.env.STRIPE_SECRET_KEY_TEST;

const openaiApiKey = process.env.OPENAI_API_KEY;

const stripe = new Stripe(stripeSecretKey);
const openai = new OpenAI({ apiKey: openaiApiKey });

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

    const email = session.customer_details?.email || "unknown@example.com";
    const rawGoals = session.metadata?.goals || "";
    const goals = rawGoals
      .split(",")
      .map((g) => g.trim())
      .filter((g) => g.length > 0);

    // ✅ AIに overview を生成させる
    const overviewPrompt = `
あなたは健康管理AIです。以下の条件に基づいて、ユーザーの体型を簡潔に評価してください。

- BMIは22.5です
- 日本語で1文で回答してください
`;

    const overviewRes = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: overviewPrompt }],
      temperature: 0.5,
    });

    const overview = overviewRes.choices[0]?.message?.content?.trim() || "体型評価取得に失敗しました";

    // ✅ AIに週間プランを生成させる
    const planPrompt = `
あなたは健康管理AIです。以下の形式で1週間分の食事・運動プランをJSONで生成してください。
必ず7件（「月」〜「日」）を含めてください。

[
  {
    "day": "月",
    "meals": {
      "breakfast": "...",
      "lunch": "...",
      "dinner": "...",
      "snack": "..."
    },
    "workout": {
      "name": "...",
      "minutes": 30,
      "tips": "..."
    }
  },
  ...
]

日本語で書いてください。曜日は「月」「火」「水」「木」「金」「土」「日」としてください。
`;

    const planRes = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: planPrompt }],
      temperature: 0.7,
    });

    const rawText = planRes.choices[0]?.message?.content || "";
    let weekPlan = [];

    try {
      weekPlan = JSON.parse(rawText);
    } catch (jsonErr) {
      console.error("❌ JSON parse error:", jsonErr);
      return NextResponse.json(
        { ok: false, error: "AIからの週間プランが解析できませんでした" },
        { status: 500 }
      );
    }

    const data = {
      email,
      bmi: 22.5,
      overview,
      goals,
      weekPlan,
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