// app/api/ai-plan/route.js
export const runtime = "nodejs";
import { NextResponse } from "next/server";

const isEmail = (s) => typeof s === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

export async function POST(req) {
  try {
    const { sessionId, inputs } = await req.json();
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }

    const system = [
      "あなたは有能なパーソナルトレーナー兼栄養士。",
      "出力は**必ず**下記Strict JSON。説明文やマークダウンは一切含めない。日本語で値を埋める。",
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
      "カロリーはざっくりでOK。一般向け・安全第一。数値は半角。"
    ].join("\n");

    const user = [
      "利用者情報（JSON）:",
      JSON.stringify(inputs ?? {}, null, 2),
    ].join("\n");

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type":"application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.3,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user }
        ],
        response_format: { type: "json_object" } // ← JSONを強制
      }),
    });

    const data = await resp.json();
    if (!resp.ok) throw new Error(data?.error?.message || `OpenAI HTTP ${resp.status}`);

    let planJson = {};
    try {
      planJson = JSON.parse(data?.choices?.[0]?.message?.content ?? "{}");
    } catch {
      planJson = {};
    }
    return NextResponse.json({ ok: true, plan: planJson });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
