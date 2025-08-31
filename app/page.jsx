"use client";
import { useState } from "react";

export default function Page() {
  // 入力用の状態（見た目は制御コンポーネントのまま）
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const inputCls =
    "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm " +
    "placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black/20";

  const labelCls = "block text-sm font-medium text-slate-700 mb-1";

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);

    const fd = new FormData(e.currentTarget);
    const h = Number(fd.get("heightCm"));
    const w = Number(fd.get("weightKg"));
    const ageVal = fd.get("age") ? Number(fd.get("age")) : undefined;
    const sexVal = fd.get("sex") || undefined;

    // lifestyle（詳細）もまとめて送る
    const lifestyle = {
      drink: fd.get("drink") || "none",
      smoke: fd.get("smoke") || "none",
      activity: fd.get("activity") || "lt1",
      sleep: fd.get("sleep") || "6to7",
      diet: fd.get("diet") || "japanese",
    };

    if (!Number.isFinite(h) || !Number.isFinite(w) || h <= 0 || w <= 0) {
      setError("身長・体重は 0 より大きい数値で入力してください。");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/free-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heightCm: h,
          weightKg: w,
          age: ageVal,
          sex: sexVal,
          lifestyle,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json?.errors?.join(" / ") || json?.error || "エラーが発生しました");
      } else {
        setResult(json.data);
      }
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <main className="mx-auto max-w-2xl p-6 md:p-10">
        <div className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm shadow-sm p-6 md:p-8">
          <header className="mb-6 md:mb-8">
            <h1 className="text-3xl font-bold tracking-tight">AI健康診断Bot（無料版）</h1>
            <p className="mt-2 text-sm text-slate-600">
              身長・体重などを入力すると、BMIとワンポイントアドバイスを表示します。
            </p>
          </header>

          <form onSubmit={onSubmit} className="space-y-5">
            {/* 基本入力 */}
            <div>
              <label htmlFor="heightCm" className={labelCls}>身長（cm）</label>
              <input
                id="heightCm"
                name="heightCm"
                type="number"
                inputMode="decimal"
                step="0.1"
                min="1"
                placeholder="例）170"
                className={inputCls}
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="weightKg" className={labelCls}>体重（kg）</label>
              <input
                id="weightKg"
                name="weightKg"
                type="number"
                inputMode="decimal"
                step="0.1"
                min="1"
                placeholder="例）65"
                className={inputCls}
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="age" className={labelCls}>年齢（任意）</label>
                <input
                  id="age"
                  name="age"
                  type="number"
                  min="0"
                  placeholder="例）45"
                  className={inputCls}
                  value={age ?? ""}
                  onChange={(e) => setAge(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="sex" className={labelCls}>性別（任意）</label>
                <select
                  id="sex"
                  name="sex"
                  className={inputCls}
                  value={sex ?? ""}
                  onChange={(e) => setSex(e.target.value)}
                >
                  <option value="">（任意）</option>
                  <option value="male">男性</option>
                  <option value="female">女性</option>
                </select>
              </div>
            </div>

            {/* 詳細（任意） */}
            <details className="rounded-xl border border-slate-200 bg-white/70 p-3 open:shadow-sm">
              <summary className="cursor-pointer select-none text-sm font-semibold text-slate-700">
                詳細（任意）
              </summary>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="drink" className={labelCls}>飲酒</label>
                  <select id="drink" name="drink" defaultValue="none" className={inputCls}>
                    <option value="none">なし</option>
                    <option value="light">少量</option>
                    <option value="medium">適量</option>
                    <option value="heavy">多い</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="smoke" className={labelCls}>喫煙</label>
                  <select id="smoke" name="smoke" defaultValue="none" className={inputCls}>
                    <option value="none">なし</option>
                    <option value="sometimes">ときどき</option>
                    <option value="daily">毎日</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="activity" className={labelCls}>運動頻度</label>
                  <select id="activity" name="activity" defaultValue="lt1" className={inputCls}>
                    <option value="lt1">週1以下</option>
                    <option value="1to3">週1〜3</option>
                    <option value="3to5">週3〜5</option>
                    <option value="gt5">週5以上</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="sleep" className={labelCls}>睡眠</label>
                  <select id="sleep" name="sleep" defaultValue="6to7" className={inputCls}>
                    <option value="lt6">6h未満</option>
                    <option value="6to7">6–7h</option>
                    <option value="7to8">7–8h</option>
                    <option value="gt8">8h以上</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="diet" className={labelCls}>食事傾向</label>
                  <select id="diet" name="diet" defaultValue="japanese" className={inputCls}>
                    <option value="japanese">和食中心</option>
                    <option value="balanced">バランス型</option>
                    <option value="carbheavy">炭水化物多め</option>
                    <option value="fastfood">外食・加工多め</option>
                    <option value="proteinheavy">たんぱく多め</option>
                  </select>
                </div>
              </div>
            </details>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-xl bg-black px-4 py-2.5 font-semibold text-white transition-colors hover:bg-black/90 disabled:opacity-60"
            >
              {loading ? "診断中..." : "無料で今日の健康診断"}
            </button>

            {error && <p className="mt-2 text-red-600">{error}</p>}

            {result && (
              <div className="mt-6 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p>
                  <span className="font-semibold">BMI：</span>
                  {result.bmi}
                </p>
                <p>
                  <span className="font-semibold">判定：</span>
                  {result.category}
                </p>
                <p>
                  <span className="font-semibold">ワンポイント：</span>
                  {result.advice}
                </p>
                {!!result.tips?.length && (
                  <ul className="list-disc pl-5 space-y-1">
                    {result.tips.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                )}
                {result.note && (
                  <p className="text-sm text-slate-500">
                    メモ：{result.note}
                  </p>
                )}
              </div>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}
