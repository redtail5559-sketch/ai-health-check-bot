// app/api/ai-plan/route.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import OpenAI from "openai";
import crypto from "crypto";

// OpenAIクライアント
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // ← Vercelの環境変数に入れてください
});

// 簡単なフォールバック（API失敗時用：ランダムで変化）
function fallbackPlan(userInput = "バランスの良い食事") {
  const choices = {
    月: [`${userInput} + 30分ウォーキング`, "おにぎり + サラダ / ジョグ20分"],
    火: ["鶏むね照り焼き / 20分ストレッチ", "焼き魚定食 / 軽い散歩"],
    水: ["野菜カレー / 休息", "そば + 温野菜 / 体幹15分"],
    木: ["さば味噌 / 30分ウォーキング", "野菜炒め / スクワット10分"],
    金: ["豚しゃぶサラダ / 20分筋トレ", "焼き鳥(塩) + サラダ / 散歩30分"],
    土: ["パスタ + サラダ / 軽い散歩", "丼ぶり + 味噌汁 / 休息"],
    日: ["好きなもの少量 / 休息", "外食OK / 散歩15分"],
  };
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  return Object.entries(choices).map(([d, arr]) => `${d}: ${pick(arr)}`);
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));

    // 任意の入力（UI側で増やせます）
    const userInput = body?.input || "バランスの良い食事";
    const profile = body?.profile || {}; // { age, sex, goal, kcal, likes, dislikes, allergies, activityLevel ... }

    const seed = crypto.randomUUID(); // バリエーション用

    // ---- OpenAI で7日メニューを生成（毎回変化：temperature↑＋seed注入）
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.9,
      messages: [
        {
          role: "system",
          content:
            "あなたは管理栄養士兼フィットネストレーナーです。食事と運動を日本語で簡潔に提案します。",
        },
        {
          role: "user",
          content: [
            "以下の条件で、1日1行・合計7行の週次プラン（食事/運動）を作成してください。",
            "各行は「月: …」〜「日: …」の形式で、短く、具体的に。重複は避ける。",
            "出力はテキストのみ。前置き/後置きの説明は不要。",
            "",
            `ユーザー入力: ${userInput}`,
            `プロフィール: ${JSON.stringify(profile)}`,
            `リクエストID(変化用seed): ${seed}`,
          ].join("\n"),
        },
      ],
    });

    // 取り出し & パース（7行だけ抜き出す）
    const raw = completion.choices?.[0]?.message?.content ?? "";
    let lines = raw
      .split("\n")
      .map((s) => s.trim().replace(/^[-・*●]\s*/, "")) // 箇条書き記号を除去
      .filter(Boolean);

    // 月〜日の順に整える（足りない分はフォールバック）
    const week = ["月", "火", "水", "木", "金", "土", "日"];
    const plan = [];
    for (const day of week) {
      const m = lines.find((l) => l.startsWith(day));
      if (m) {
        plan.push(m);
      } else {
        // day が無ければフォールバックから補完
        const fb = fallbackPlan(userInput).find((l) => l.startsWith(day));
        plan.push(fb || `${day}: ${userInput} / 散歩20分`);
      }
    }

    return NextResponse.json(
      { ok: true, ts: Date.now(), seed, plan },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      }
    );
  } catch (e) {
    // 失敗時はフォールバックで返す（常に変化あり）
    const plan = fallbackPlan();
    return NextResponse.json(
      { ok: true, ts: Date.now(), seed: "fallback", plan, note: String(e?.message || e) },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      }
    );
  }
}

// GETは診断用（任意）
export async function GET() {
  return NextResponse.json(
    { ok: true, note: "POSTで呼んでね", ts: Date.now() },
    { headers: { "Cache-Control": "no-store" } }
  );
}
