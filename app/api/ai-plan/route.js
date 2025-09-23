// app/api/ai-plan/route.js
export const runtime = "edge";                 // ← 統一（nodejs は削除）
export const dynamic = "force-dynamic";
export const revalidate = 0; // ISR無効（常に動的）

import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { sessionId, inputs } = await req.json();
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }

    // 同一入力でも毎回揺れるための乱数（出力に含めない）
    const nonce = Math.random().toString(36).slice(2);

    const system = [
      "あなたは有能なパーソナルトレーナー兼栄養士です。",
      "出力は**必ず**下記 Strict JSON。説明文やマークダウンは一切含めない。日本語で値を埋める。",
      "対象は一般成人。医療診断は行わず、安全第一で一般的な提案のみ。数値は半角。",
      "",
      "schema:",
      `{
        "profile": { "summary": string },
        "week": [
          {
            "day": "月"|"火"|"水"|"木"|"金"|"土"|"日",
            "meals": { "breakfast": string, "lunch": string, "dinner": string, "snack": string },
            "workout": { "menu": string, "durationMin": number, "notes": string }
          }
        ],
        "notes": [string,string,string]
      }`,
    ].join("\n");

    const user = [
      "【利用者情報（JSON）】",
      JSON.stringify(inputs ?? {}, null, 2),
      "",
      "【生成要件】",
      "- 1週間分の食事と運動メニューをバランスよく提案する。",
      "- 食事は日本の家庭で実行しやすい表現を心がける（例：和定食、丼、麺類でも“具や量”を工夫）。",
      "- workout.menu は自重・自宅でも可能な内容中心で可。器具が必要な場合は代替案を notes に添える。",
      "- meals.snack は未使用なら \"なし\" と書く。",
      "- 同じ表現の連続やコピペ的な繰り返しを避け、バリエーションを持たせる。",
      "- 曜日配列は月→日で7件。",
      "- JSON以外は一切出力しない。",
      "",
      "【ランダム性の付与（この行は出力に含めない）】",
      `nonce: ${nonce}`,
    ].join("\n");

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing" },
        { status: 500 }
      );
    }

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      cache: "no-store", // ← キャッシュ禁止
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.9,         // ← ランダム性を高める
        top_p: 1,
        presence_penalty: 0.4,    // ← 繰り返しを抑制
        frequency_penalty: 0.25,  // ← 言い回しの重複抑制
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    const data = await resp.json();
    if (!resp.ok) {
      const m = data?.error?.message || `OpenAI HTTP ${resp.status}`;
      throw new Error(m);
    }

    let planJson = {};
    try {
      planJson = JSON.parse(data?.choices?.[0]?.message?.content ?? "{}");
    } catch {
      planJson = {};
    }

    // 簡易バリデーション（必須キーが無い場合のガード）
    if (!planJson?.week || !Array.isArray(planJson.week) || planJson.week.length !== 7) {
      // モデルの気まぐれで短い場合に備え、最低限の形だけ補完
      planJson.week = (planJson.week ?? []).slice(0, 7);
      const days = ["月","火","水","木","金","土","日"];
      for (let i = 0; i < 7; i++) {
        if (!planJson.week[i]) {
          planJson.week[i] = {
            day: days[i],
            meals: { breakfast: "和定食（ご飯少なめ・味噌汁・焼き魚）", lunch: "鶏むね丼（野菜多め）", dinner: "豆腐と野菜の炒め物", snack: "なし" },
            workout: { menu: "早歩き", durationMin: 20, notes: "余裕あれば体幹プランク各30秒×2" },
          };
        }
      }
      planJson.profile ??= { summary: "一般向けの安全な範囲で調整した1週間プランです。" };
      planJson.notes ??= ["無理のない範囲で実行しましょう", "水分はこまめに、甘い飲料は控えめに", "体調不良時は休みを優先する"];
    }

    return NextResponse.json({ ok: true, plan: planJson });
  } catch (e) {
    return NextResponse.json({ error: e?.message || "server error" }, { status: 500 });
  }
}
