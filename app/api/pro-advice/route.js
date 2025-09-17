// app/api/pro-advice/route.js
import { NextResponse } from "next/server";

/* ---------- ユーティリティ ---------- */
const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const round = (n, d = 1) => {
  const p = 10 ** d;
  return Math.round(n * p) / p;
};
const bmiOf = (hCm, wKg) => round(wKg / (Math.pow(hCm / 100, 2)), 1);
const categoryJASSO = (bmi) => {
  if (bmi < 18.5) return "低体重";
  if (bmi < 25) return "普通体重";
  if (bmi < 30) return "肥満（1度）";
  if (bmi < 35) return "肥満（2度）";
  if (bmi < 40) return "肥満（3度）";
  return "肥満（4度）";
};

/* ---------- 共通の出力フォーマット ---------- */
/**
 * 生成するJSONのターゲット形
 * {
 *   overview: string,            // はじめの総評（2〜3行）
 *   goals: [string],             // 今週の目標（短文3〜5個）
 *   caloriesTarget: string,      // 目安カロリーやPFCバランス（任意）
 *   weekPlan: [                  // 1週間プラン
 *     {
 *       day: "Mon",
 *       meals: { breakfast, lunch, dinner, snack },
 *       workout: { name, minutes, intensity, tips }
 *     }, ... 7件
 *   ],
 *   shoppingList: [string],      // 買い物リスト（10〜20個）
 *   cautions: [string]           // 注意点・医療的注意（2〜4個）
 * }
 */

/* ---------- GET: 仕様表示 ---------- */
export async function GET() {
  return NextResponse.json({
    ok: true,
    spec: {
      endpoint: "POST /api/pro-advice",
      expects: {
        heightCm: "number",
        weightKg: "number",
        age: "number | null",
        sex: "string | null",
        lifestyle: {
          drink: "string",
          smoke: "string",
          activity: "string",
          sleep: "string",
          diet: "string",
        },
        email: "string | null (Stripe成功後・決済メールを使う想定)",
      },
      returns: "{ ok, data: { bmi, category, overview, goals[], caloriesTarget, weekPlan[7], shoppingList[], cautions[] } }",
    },
  });
}

/* ---------- POST: 有料レポート生成（AI） ---------- */
export async function POST(req) {
  try {
    const body = await req.json();

    const h = toNumber(body?.heightCm);
    const w = toNumber(body?.weightKg);
    if (!h || !w) {
      return NextResponse.json(
        { ok: false, error: "heightCm と weightKg は必須です。" },
        { status: 400 }
      );
    }

    const bmi = bmiOf(h, w);
    const category = categoryJASSO(bmi);

    const payload = {
      heightCm: h,
      weightKg: w,
      bmi,
      bmiCategory: category,
      age: toNumber(body?.age),
      sex: body?.sex ?? null,
      lifestyle: body?.lifestyle ?? {},
      email: body?.email ?? null,
    };

    // --- プロンプト（日本語で厳密にJSON出力を指示） ---
    const system = `
あなたは栄養士かつパーソナルトレーナーです。
日本人向けの一般的な健康アドバイスを、わかりやすい日本語で作成してください。
医療診断は行わず、受診が必要な可能性には注意喚起のみを行ってください。
出力は必ず JSON のみ。余計な文章は一切出力しないこと。
    `.trim();

    const user = `
# ユーザー情報
- 身長: ${payload.heightCm} cm
- 体重: ${payload.weightKg} kg
- BMI: ${payload.bmi}（${payload.bmiCategory}）
- 年齢: ${payload.age ?? "不明"}
- 性別: ${payload.sex ?? "不明"}

# ライフスタイル（自由記述）
- 飲酒: ${payload.lifestyle?.drink ?? "-"}
- 喫煙: ${payload.lifestyle?.smoke ?? "-"}
- 運動: ${payload.lifestyle?.activity ?? "-"}
- 睡眠: ${payload.lifestyle?.sleep ?? "-"}
- 食事: ${payload.lifestyle?.diet ?? "-"}

# 生成要件
- ターゲット: 一般成人向け（特定疾患の治療計画は含めない）
- 文字数目安: 画面表示とPDF両対応（過度に長くしない）
- 食事プラン: 7日分（朝・昼・夜・間食を具体的に/量は目安で簡潔）
- 運動プラン: 7日分（有酸素と筋トレをバランス良く/分数・強度・注意点）
- 生活習慣の改善: ライフスタイル入力を踏まえた一言を毎日に1つ混ぜる
- もし飲酒・喫煙に言及が必要なら控えめかつ実行可能な提案に限定
- 可能なら摂取カロリー目安やPFCの一例を1行で示す

# JSONスキーマ
{
  "overview": "string (2-3行)",
  "goals": ["string", "string", "string"],
  "caloriesTarget": "string",
  "weekPlan": [
    {
      "day": "Mon|Tue|Wed|Thu|Fri|Sat|Sun",
      "meals": { "breakfast": "string", "lunch": "string", "dinner": "string", "snack": "string" },
      "workout": { "name": "string", "minutes":  number, "intensity": "楽～ややキツい など", "tips": "string" }
    }
    // 合計7件
  ],
  "shoppingList": ["string", "..."],
  "cautions": ["string", "..."]
}
`.trim();

    // --- OpenAI 呼び出し ---
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: "OPENAI_API_KEY が設定されていません。" },
        { status: 500 }
      );
    }

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",          // コスト最適なマルチモーダルGPT
        temperature: 0.6,              // 文章の柔らかさ
        max_tokens: 1800,              // 出力しすぎ防止
        response_format: { type: "json_object" }, // JSONのみを強制
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    if (!resp.ok) {
      const e = await resp.text();
      return NextResponse.json({ ok: false, error: `OpenAI API error: ${e}` }, { status: 502 });
    }

    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content ?? "{}";

    // JSONとしてパース（安全側）
    let ai;
    try {
      ai = JSON.parse(content);
    } catch {
      // 念のため再ラップ
      ai = { overview: content };
    }

    return NextResponse.json({
      ok: true,
      data: {
        bmi,
        category,
        ...ai,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: "サーバーエラーが発生しました。" },
      { status: 500 }
    );
  }
}
