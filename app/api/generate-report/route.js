export const runtime = 'nodejs';
import Stripe from "stripe";

// A 推奨：空文字を渡して型/ビルド上の未定義を避ける
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const { sessionId } = await req.json();
    if (!sessionId) return new Response("Missing sessionId", { status: 400 });

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ error: "未決済です。" }), { status: 400 });
    }

    const form = (() => {
      try { return JSON.parse(session.metadata?.form || "{}"); } catch { return {}; }
    })();

    // ★ ここでOpenAIを使ってリッチに生成してもOK
    const lines = [];
    lines.push("健康的なライフスタイル維持のための7日間プランです。");
    if (form.height && form.weight) {
      const h = parseFloat(form.height) / 100;
      const w = parseFloat(form.weight);
      const bmi = (w / (h * h)).toFixed(1);
      lines.push(`推定BMI：${bmi}`);
    }
    // ダミー週間プラン（実運用ではOpenAIで詳細生成）
    lines.push("\n1週間の食事・運動プラン");
    ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].forEach((d)=> {
      lines.push(`\n${d}\n朝食: バランスの良い食事\n昼食: たんぱく質多め\n夕食: 野菜を中心に\n間食: ヨーグルト\n運動: 30分`);
      lines.push("Tips: 水分補給を忘れずに。");
    });

    return Response.json({
      report: lines.join("\n"),
      email: session.customer_email || "",
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
