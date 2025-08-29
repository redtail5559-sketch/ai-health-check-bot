// app/api/free-advice/route.js
export const runtime = "edge"; // 高速・低コールドスタート

export async function POST(req) {
  try {
    const body = await req.json();
    const { bmi, age, sex, habit } = body;

    // ここではダミー実装（まずはデプロイを安定させる）
    // 後で OpenAI API 呼び出しに置き換えます
    const tip =
      `一般情報：BMI=${bmi}。食事は野菜・たんぱく質を意識し、` +
      `外食時は揚げ物や大盛りを避けると◎。運動は器具なしスクワットや早歩きを` +
      `週2-3回から。睡眠は就寝起床を一定に。`;

    return new Response(JSON.stringify({ tip }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "invalid_request" }), { status: 400 });
  }
}
