// app/api/free-advice/route.js
import { NextResponse } from "next/server";

/* ---- 既存ユーティリティ ---- */
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

/* ---- POST: 簡易AIアドバイス（無料版） ---- */
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

    const bmi = bmiOf(heightCm, weightKg);
    const category = categoryJASSO(bmi);

    const apiKey = process.env.OPENAI_API_KEY;

    // --- APIキーが無い時はフォールバック（従来の簡易ルール） ---
    if (!apiKey) {
      const advice =
        category === "低体重"
          ? "まずは3食きちんと。間食で乳製品やナッツを少量プラス。"
          : category === "普通体重"
          ? "今の調子をキープ。甘い飲料は“週に数回まで”を意識。"
          : "まずは飲料を無糖に。早歩き15分から始めよう。";
      const tips = [
        "水かお茶を基本にする",
        "エレベーターは階段に置き換え",
        "就寝2時間前は食べない",
      ];
      return NextResponse.json({ ok: true, data: { bmi, category, advice, tips } });
    }

    // --- ここからAI生成（短く・無料枠想定で低コスト） ---
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

# ライフスタイル（任意・短評でOK）
- 飲酒: ${lifestyle?.drink ?? "-"}
- 喫煙: ${lifestyle?.smoke ?? "-"}
- 運動: ${lifestyle?.activity ?? "-"}
- 睡眠: ${lifestyle?.sleep ?? "-"}
- 食事: ${lifestyle?.diet ?? "-"}

# 生成要件
- 「無料版」向けの**簡易アドバイス**を作る。
- ライフスタイルに触れた一言を含める（例：飲酒が多い→“まずは本数を減らす”等）。
- 文量: adviceは全角90〜140文字。tipsは短文3つ。noteは1行まで（任意）。
- 口調はやさしく実行可能な内容に限定。

# 出力JSONの形
{
  "advice": "string（90-140字、1段落）",
  "tips": ["string","string","string"],
  "note": "string（任意・1行）"
}
`.trim();

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",              // 低コスト・十分な品質
        temperature: 0.6,
        max_tokens: 350,                   // 出力しすぎ防止（=コスト抑制）
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
