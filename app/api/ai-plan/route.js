// app/api/ai-plan/route.js
export const runtime = "edge";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";

// --- 重複を簡易検出して微修正（最終防衛ライン） ---
function diversifyWeek(week) {
  if (!Array.isArray(week)) return week;
  const tweakMeal = (s, salt) =>
    typeof s === "string" ? `${s}（変化:${salt}）` : s;
  const tweakWork = (s, salt) =>
    typeof s === "string" ? `${s}＋バリエーション${salt}` : s;

  const seen = new Set();
  for (let i = 0; i < week.length; i++) {
    const w = week[i] || {};
    const sig =
      JSON.stringify([w?.meals?.breakfast, w?.meals?.lunch, w?.meals?.dinner, w?.workout?.menu]) || "";
    if (seen.has(sig)) {
      const salt = i + 1;
      // 朝昼夕・ワークアウトに軽い変化を入れる
      if (w?.meals) {
        w.meals.breakfast = tweakMeal(w.meals.breakfast, salt);
        w.meals.lunch = tweakMeal(w.meals.lunch, salt);
        w.meals.dinner = tweakMeal(w.meals.dinner, salt);
      }
      if (w?.workout) {
        w.workout.menu = tweakWork(w.workout.menu, salt);
      }
    }
    seen.add(
      JSON.stringify([w?.meals?.breakfast, w?.meals?.lunch, w?.meals?.dinner, w?.workout?.menu]) || ""
    );
    week[i] = w;
  }
  return week;
}

export async function POST(req) {
  try {
    const { sessionId, inputs } = await req.json();
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }

    // 同じ入力でも必ず揺らぐための乱数 + 曜日ごとのシード
    const seed = Math.random().toString(36).slice(2);
    const daySeeds = ["月","火","水","木","金","土","日"].map((d,i) => `${d}-${seed}-${i}`);

    const system = [
      "あなたは有能なパーソナルトレーナー兼栄養士です。",
      "出力は**必ず**下記 Strict JSON。説明文やマークダウンは一切含めない。日本語で値を埋める。",
      "一般成人向け。医療診断は行わず、安全第一で一般的な提案のみ。数値は半角。",
      "",
      "重要な制約：",
      "- 7日分（曜日は月→日）を**必ず**出す。",
      "- **各曜日で食事・運動の内容を変える**（同じ文言の繰り返し禁止）。",
      "- 同じ料理でも具材・量・調理法等でバリエーションをつけること。",
      "- workout.menu は自宅/自重中心で可。器具が必要な場合は notes に代替案。",
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
      "- 食事は日本の家庭で実行しやすい表現（例：和定食/丼/麺類も“具や量”で調整）",
      "- meals.snack は未使用なら \"なし\" と書く。",
      "- 同じ表現の連続やコピペ的な繰り返しを避ける。",
      "- JSON 以外は一切出力しない。",
      "",
      "【曜日ごとのシード（出力に含めない／内部ランダム化用）】",
      JSON.stringify(daySeeds),
      "",
      "【グローバルシード（出力に含めない）】",
      seed,
    ].join("\n");

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY is missing" }, { status: 500 });
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
        temperature: 1.0,         // ← 揺らぎを最大寄りに
        top_p: 1,
        presence_penalty: 0.6,    // ← 同じ話題の連発を抑制
        frequency_penalty: 0.5,   // ← 同じ言い回しの連発を抑制
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

    // 最低限の形を補完
    const days = ["月","火","水","木","金","土","日"];
    planJson.week = Array.isArray(planJson.week) ? planJson.week.slice(0, 7) : [];
    for (let i = 0; i < 7; i++) {
      if (!planJson.week[i]) planJson.week[i] = {};
      planJson.week[i].day ??= days[i];
      planJson.week[i].meals ??= { breakfast: "和定食（ご飯少なめ）", lunch: "鶏むね丼", dinner: "豆腐と野菜炒め", snack: "なし" };
      planJson.week[i].workout ??= { menu: "早歩き", durationMin: 20, notes: "余裕あれば体幹プランク各30秒×2" };
    }

    // 曜日間で同一内容が並ぶ場合はサーバー側で微修正して差異を作る
    planJson.week = diversifyWeek(planJson.week);

    planJson.profile ??= { summary: "一般向けの安全な範囲で調整した1週間プランです。" };
    planJson.notes ??= ["無理のない範囲で実行しましょう", "水分はこまめに、甘い飲料は控えめに", "体調不良時は休みを優先する"];

    return NextResponse.json({ ok: true, plan: planJson });
  } catch (e) {
    return NextResponse.json({ error: e?.message || "server error" }, { status: 500 });
  }
}
