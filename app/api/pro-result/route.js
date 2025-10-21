// app/api/pro-result/route.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });

/* ---------- 小ユーティリティ ---------- */
const toNum = (v) => (v == null ? null : Number(v));
const clean = (s) => (typeof s === "string" ? s.replace(/\$/g, "").trim() : s);

function bmi(heightCm, weightKg) {
  const h = Number(heightCm) / 100;
  if (!h || !weightKg) return null;
  return Math.round((Number(weightKg) / (h * h)) * 10) / 10;
}

const DAYS = ["月","火","水","木","金","土","日"];

/* ---------- AI で weekPlan を作る ---------- */
async function createWeekPlanAI(profile, seed) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is missing");

  // JSON Schema を渡して“厳格JSON”を強制
  const schema = {
    type: "object",
    properties: {
      week: {
        type: "array",
        minItems: 7,
        maxItems: 7,
        items: {
          type: "object",
          properties: {
            day: { type: "string", enum: DAYS.map(d => `${d}曜日`) },
            meals: {
              type: "object",
              properties: {
                breakfast: { type: "string" },
                lunch: { type: "string" },
                dinner: { type: "string" },
                snack: { type: "string" }
              },
              required: ["breakfast","lunch","dinner","snack"],
              additionalProperties: false
            },
            workout: {
              type: "object",
              properties: {
                name: { type: "string" },
                minutes: { type: "number" },
                tips: { type: "string" }
              },
              required: ["name","minutes"],
              additionalProperties: true
            }
          },
          required: ["day","meals","workout"],
          additionalProperties: false
        }
      },
      notes: {
        type: "array",
        items: { type: "string" }
      }
    },
    required: ["week"],
    additionalProperties: true
  };

  const sys = `
あなたは日本語の管理栄養士兼パーソナルトレーナーです。
ユーザーの属性/目標/生活習慣に応じて、科学的かつ実行可能な食事・運動プランを作ります。
禁止: 医療診断・薬剤指示・危険行為。塩分/糖分/アルコール等は一般的な健康指針に沿って助言。
出力は**必ず**指定の JSON Schema のみ。文章やマークダウンは出力しない。
`.trim();

  const user = `
# プロフィール
${JSON.stringify(profile, null, 2)}

# 指示
- 7日分のプランを作成。各曜日は重複しないメニューにする（特に昼/夜は毎日変える）。
- 分量は「小盛/普通/控えめ」などの日本語表現でざっくり指定可。
- 各日の Tips は必ず違う内容にする。
- 運動は有酸素＋自重/筋トレをバランス良く。水・日など2日は軽め/回復日に。
- 出力は日付順（${DAYS.join("→")}）で。
`.trim();

  const body = {
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: sys },
      { role: "user", content: user }
    ],
    // “毎回ユニーク”の源泉：温度＋シード（temperatureはやや高め）
    temperature: 0.8,
    max_tokens: 1800,
    response_format: { type: "json_schema", json_schema: { name: "WeekPlan", schema, strict: true } },
    // OpenAIは user_id/seed を受け取らないので、プロンプトに含めて非決定性を確保
    // （上の temperature により毎回ユニークになります）
  };

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
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (e) {
    throw new Error("AI JSON parse failed");
  }
  return parsed;
}

/* ---------- フォールバック（AI失敗時） ---------- */
function fallbackWeekPlan(profile) {
  // 最低限の重複回避ロジックで7日埋める
  const breakfasts = [
    "和定食（ごはん少なめ）","オートミール＋ヨーグルト＋バナナ","納豆ご飯＋味噌汁",
    "サンドイッチ＋サラダ","ヨーグルト＋フルーツ","卵2個＋サラダ","玄米おにぎり＋みそ汁"
  ];
  const lunches = [
    "鶏むね丼（小盛）","サーモン丼（小盛）","和風オムライス（控えめ）",
    "豆腐ハンバーグ＋サラダ","鶏照り焼き＋玄米","豚肉野菜炒め＋玄米","そば＋温野菜"
  ];
  const dinners = [
    "鮭の塩焼き＋味噌汁＋野菜","白身魚のムニエル＋サラダ＋スープ","鶏もも照り焼き＋副菜2品",
    "サバの塩焼き＋おひたし＋雑穀ご飯","豆腐と野菜の中華炒め＋スープ","豚しゃぶサラダ＋味噌汁","野菜たっぷり鍋"
  ];
  const snacks = ["きなこヨーグルト","素焼きナッツ","ダークチョコ少量","ギリシャヨーグルト","チーズ少量"];

  const w = [];
  for (let i = 0; i < 7; i++) {
    w.push({
      day: `${DAYS[i]}曜日`,
      meals: {
        breakfast: breakfasts[i % breakfasts.length],
        lunch: lunches[i % lunches.length],
        dinner: dinners[i % dinners.length],
        snack: snacks[i % snacks.length],
      },
      workout: i === 2 || i === 6
        ? { name: "ストレッチ＋散歩", minutes: 20, tips: "寝る前10分ストレッチ" }
        : { name: "早歩き＋自重筋トレ", minutes: 40, tips: "スクワット10×3など" }
    });
  }
  return { week: w, notes: ["AI失敗フォールバック"] };
}

/* ---------- GET: Stripe セッション → AI 週プラン ---------- */
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
      diet: md.diet || "", // “増量/減量/バランス”など
    };

    // 総括
    const bmiVal = bmi(profile.heightCm, profile.weightKg);
    const overview = (() => {
      if (!bmiVal) return "入力値から全体傾向を評価しました。無理なく続けられる内容に調整しています。";
      if (bmiVal < 18.5) return `BMIは${bmiVal}。やせ傾向。タンパク質と睡眠を確保しつつ計画的に増量を。`;
      if (bmiVal < 25)   return `BMIは${bmiVal}。標準。姿勢・筋力・体力の底上げを狙いましょう。`;
      return `BMIは${bmiVal}。やや高め。食事の質と量を整え、有酸素＋筋トレで代謝を上げる方針を。`;
    })();

    // AI 生成（リトライ & フォールバック）
    const seed = `${sessionId}-${Date.now()}`; // ユニーク性担保に使う（プロンプトに含まれる）
    let planJson, usedAi = false, aiError = null;

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const out = await createWeekPlanAI({ ...profile, seed }, seed);
        planJson = out;
        usedAi = true;
        break;
      } catch (e) {
        aiError = String(e?.message || e);
      }
    }
    if (!planJson) planJson = fallbackWeekPlan(profile);

    // サニタイズ & 7日整形
    const weekPlan = (planJson?.week || []).slice(0, 7).map((d, i) => ({
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
    }));
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
      __debug: { usedAiPlan: usedAi, aiError, seed },
    };

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (e) {
    console.error("[pro-result] error:", e);
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
