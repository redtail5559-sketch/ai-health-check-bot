// app/api/free-advice/route.js
export async function POST(req) {
  try {
    const body = await req.json();

    // 受け取りフォーマット（必要最低限）
    const heightCm = Number(body?.heightCm);
    const weightKg = Number(body?.weightKg);
    const age = body?.age ? Number(body.age) : null;     // 任意
    const sex = body?.sex ?? null;                       // "male" | "female" | null（任意）

    // バリデーション
    const errors = [];
    if (!Number.isFinite(heightCm)) errors.push("heightCm は数値で必須です（cm）");
    if (!Number.isFinite(weightKg)) errors.push("weightKg は数値で必須です（kg）");
    if (heightCm <= 0) errors.push("heightCm は 0 より大きい必要があります");
    if (weightKg <= 0) errors.push("weightKg は 0 より大きい必要があります");
    if (errors.length) {
      return new Response(
        JSON.stringify({ ok: false, errors }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // BMI 計算
    const h = heightCm / 100;
    const bmiRaw = weightKg / (h * h);
    const bmi = Math.round(bmiRaw * 10) / 10; // 小数1桁に丸め

    // 分類（日本の基準ベース）
    let category = "";
    if (bmi < 18.5) category = "低体重（やせ）";
    else if (bmi < 25) category = "普通体重";
    else if (bmi < 30) category = "肥満（1度）";
    else if (bmi < 35) category = "肥満（2度）";
    else if (bmi < 40) category = "肥満（3度）";
    else category = "肥満（4度）";

    // ワンポイントアドバイス（超要約）
    const advice = (() => {
      if (bmi < 18.5)
        return "エネルギーとたんぱく質を意識的に。毎食の主食＋主菜（肉・魚・卵・大豆）をしっかり。";
      if (bmi < 25)
        return "今のリズムを継続。1日7,000歩＋野菜優先（先サラダ）で体重の安定を。";
      if (bmi < 30)
        return "“まず飲み物”を無糖へ置き換え。週150分の早歩きで1〜2kgの減量から。";
      if (bmi < 35)
        return "間食・夜食の頻度を半減。たんぱく質多め、主食は拳1つ分を目安に。";
      if (bmi < 40)
        return "医療機関や専門家の支援も検討。食事は“腹七分”＋毎日こまめに歩数稼ぎ。";
      return "専門家のサポートで段階的減量を。無理なく“続く方法”に全振りしましょう。";
    })();

    // 追加ヒント（UIで箇条書き表示しやすいよう配列）
    const tips = [];
    if (bmi >= 25) tips.push("砂糖入り飲料→ゼロ飲料・無糖茶に置き換え");
    if (bmi >= 23 && bmi < 25) tips.push("体重を週1で記録：増加の早期発見に");
    if (bmi < 18.5) tips.push("間食にヨーグルト・チーズ・ナッツを活用");
    tips.push("睡眠は目標7時間：食欲ホルモンが整いやすい");

    // 任意メモ（年齢や性別を活かした軽い補足）
    let note = null;
    if (age && age >= 40 && bmi >= 23 && bmi < 25) {
      note = "40歳以上はBMI23でも代謝リスクが上がりやすい報告あり。定期検診を。";
    }

    return new Response(
      JSON.stringify({
        ok: true,
        data: {
          bmi,
          category,
          advice,
          tips,
          inputs: { heightCm, weightKg, age, sex },
          note
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: "サーバーエラーが発生しました", detail: String(e?.message ?? e) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// （任意）動作確認用：GETで仕様を返す
export async function GET() {
  return new Response(
    JSON.stringify({
      ok: true,
      spec: {
        method: "POST",
        endpoint: "/api/free-advice",
        bodyExample: { heightCm: 170, weightKg: 65, age: 45, sex: "male" },
      },
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
const lifestyle = body?.lifestyle ?? {};
const {
  drink = "none",        // none/light/medium/heavy
  smoke = "none",        // none/sometimes/daily
  activity = "lt1",      // lt1/1to3/3to5/gt5
  sleep = "6to7",        // lt6/6to7/7to8/gt8
  diet = "japanese",     // japanese/balanced/carbheavy/fastfood/proteinheavy
} = lifestyle;

