// app/api/free-advice/route.js
export const runtime = "edge";
export const dynamic = "force-dynamic";
export const revalidate = 0; // ISR無効（常に動的）

import { NextResponse } from "next/server";

/* ---- ユーティリティ ---- */
const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const round = (n, d = 1) => {
  const p = 10 ** d;
  return Math.round(n * p) / p;
};
const bmiOf = (hCm, wKg) => round(wKg / Math.pow(hCm / 100, 2), 1);
const categoryJASSO = (bmi) => {
  if (bmi < 18.5) return "低体重";
  if (bmi < 25) return "普通体重";
  if (bmi < 30) return "肥満（1度）";
  if (bmi < 35) return "肥満（2度）";
  if (bmi < 40) return "肥満（3度）";
  return "肥満（4度）";
};

// ランダムに配列から n 件取り出す（重複なし）
function sampleN(arr, n) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

/* ---- GET: 仕様確認 ---- */
export async function GET() {
  return NextResponse.json({
    ok: true,
    spec: {
      endpoint: "POST /api/free-advice",
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
      },
      returns:
        "{ ok, data: { bmi:number, category:string, advice:string, tips:string[], note?:string } }",
    },
  });
}

/* ---- POST: 簡易AIアドバイス（無料版／毎リクエスト完全ランダム） ---- */
export async function POST(req) {
  try {
    const body = await req.json();
    const heightCm = toNumber(body?.heightCm);
    const weightKg = toNumber(body?.weightKg);
    if (!heightCm || !weightKg) {
      return NextResponse.json(
        { ok: false, error: "heightCm と weightKg は必須です。" },
        { status: 400 }
      );
    }

    const age = toNumber(body?.age);
    const sex = body?.sex ?? null;
    const lifestyle = body?.lifestyle ?? {};
    const goal = body?.goal?.trim();
    if (!goal) {
      return NextResponse.json(
        { ok: false, error: "目的（goal）は必須です。" },
        { status: 400 }
      );
    }

    const bmi = bmiOf(heightCm, weightKg);
    const category = categoryJASSO(bmi);

    const apiKey = process.env.OPENAI_API_KEY;

    // --- APIキーが無い時のフォールバック（完全ランダム） ---
    if (!apiKey) {
      const advicePool = [
        "今日は水分をこまめに。食事は野菜から食べ始めましょう。",
        "軽いストレッチで肩と股関節をほぐして、血流アップを。",
        "就寝90分前の入浴で睡眠の質を上げましょう。",
        "甘い飲料は今日はお休み。無糖の温かい飲み物に。",
        "エレベーターの代わりに階段を。1分でもOK。",
        "間食は素焼きナッツかヨーグルトを少量に。",
      ];
      const tips = sampleN(
        [
          "水かお茶を基本にする",
          "就寝2時間前は食べない",
          "ゆっくり噛んで食べる",
          "朝に日光を浴びる",
          "歩く速度を少し速める",
          "アルコールは量を決めて守る",
        ],
        3
      );
      const advice = advicePool[Math.floor(Math.random() * advicePool.length)];
      return NextResponse.json({ ok: true, data: { bmi, category, advice, tips } });
    }

    // --- ここからAI生成（毎回ランダム化） ---
    // 乱数で“同一入力でも毎回ゆらぐ”ようにする
    const nonce = Math.random().toString(36).slice(2);

    const system = `
あなたは日本語の健康アドバイスを短く作るアシスタントです。
医療診断は行わず、一般的で安全な提案のみを簡潔に出してください。
出力は必ず JSON のみ。
`.trim();

    const user = `
# ユーザー
- 身長: ${heightCm}cm
- 体重: ${weightKg}kg
- BMI: ${bmi}（${category}）
- 年齢: ${age ?? "不明"}
- 性別: ${sex ?? "不明"}
- 目的: ${goal}

# ライフスタイル（短評でOK）
- 飲酒: ${lifestyle?.drink ?? "-"}
- 喫煙: ${lifestyle?.smoke ?? "-"}
- 運動: ${lifestyle?.activity ?? "-"}
- 睡眠: ${lifestyle?.sleep ?? "-"}
- 食事: ${lifestyle?.diet ?? "-"}

# 生成要件
- 「無料版」向けの**簡易アドバイス**を作る。
- ライフスタイルに触れた一言を含める。
- 文量: adviceは全角90〜140文字。tipsは短文3つ。noteは1行まで（任意）。
- 口調はやさしく実行可能な内容に限定。

# 出力JSONの形
{
  "advice": "string（90-140字、1段落）",
  "tips": ["string","string","string"],
  "note": "string（任意・1行）"
}

# 乱数（同一入力でも毎回変化させるための種。内容に出力しない）:
${nonce}
`.trim();

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      // ★キャッシュ完全無効化（ビルド・エッジの応答キャッシュも回避）
      cache: "no-store",
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.9,            // ← ランダム性を高める
        top_p: 1,
        max_tokens: 350,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    if (!resp.ok) {
      const e = await resp.text();
      return NextResponse.json(
        { ok: false, error: `OpenAI API error: ${e}` },
        { status: 502 }
      );
    }

    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content ?? "{}";

    let ai;
    try {
      ai = JSON.parse(content);
    } catch {
      ai = { advice: content, tips: [] };
    }

    // 既存仕様に合わせて返却
    return NextResponse.json({
      ok: true,
      data: {
        bmi,
        category,
        advice: ai.advice,
        tips: Array.isArray(ai.tips) ? ai.tips : [],
        note: ai.note ?? undefined,
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
