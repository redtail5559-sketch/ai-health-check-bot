// app/page.jsx
"use client";
import { useState } from "react";

export default function Page() {
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");
  const [result, setResult] = useState(null);

  // 必須＋任意
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("male");

  // 詳細（任意）
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [drink, setDrink] = useState("none");        // none/light/medium/heavy
  const [smoke, setSmoke] = useState("none");        // none/sometimes/daily
  const [activity, setActivity] = useState("lt1");   // lt1/1to3/3to5/gt5
  const [sleep, setSleep] = useState("6to7");        // lt6/6to7/7to8/gt8
  const [diet, setDiet] = useState("japanese");      // japanese/balanced/carbheavy/fastfood/proteinheavy

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);

    const h = Number(heightCm);
    const w = Number(weightKg);
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
          age: age ? Number(age) : undefined,
          sex,
          lifestyle: { drink, smoke, activity, sleep, diet }, // ← 追加
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
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-3xl font-bold mb-2">AI健康診断Bot（無料版）</h1>
      <p className="mb-6 text-sm text-gray-600">
        身長・体重などを入力すると、BMIとワンポイントアドバイスを表示します。
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">身長（cm）</label>
          <input type="number" inputMode="decimal" step="0.1" min="1"
                 placeholder="例）170" className="w-full rounded border p-2"
                 value={heightCm} onChange={(e)=>setHeightCm(e.target.value)} required />
        </div>

        <div>
          <label className="block text-sm mb-1">体重（kg）</label>
          <input type="number" inputMode="decimal" step="0.1" min="1"
                 placeholder="例）65" className="w-full rounded border p-2"
                 value={weightKg} onChange={(e)=>setWeightKg(e.target.value)} required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">年齢（任意）</label>
            <input type="number" min="0" placeholder="例）45"
                   className="w-full rounded border p-2"
                   value={age} onChange={(e)=>setAge(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">性別（任意）</label>
            <select className="w-full rounded border p-2"
                    value={sex} onChange={(e)=>setSex(e.target.value)}>
              <option value="male">男性</option>
              <option value="female">女性</option>
            </select>
          </div>
        </div>

        {/* 詳細（任意） */}
        <div className="rounded border">
          <button type="button"
                  className="w-full text-left px-3 py-2 font-semibold"
                  onClick={()=>setShowAdvanced(v=>!v)}>
            {showAdvanced ? "▲ 詳細（任意）を閉じる" : "▼ 詳細（任意）を開く"}
          </button>

          {showAdvanced && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 pt-0">
              <div>
                <label className="block text-sm mb-1">飲酒</label>
                <select className="w-full rounded border p-2"
                        value={drink} onChange={(e)=>setDrink(e.target.value)}>
                  <option value="none">なし</option>
                  <option value="light">少ない</option>
                  <option value="medium">普通</option>
                  <option value="heavy">多い</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">喫煙</label>
                <select className="w-full rounded border p-2"
                        value={smoke} onChange={(e)=>setSmoke(e.target.value)}>
                  <option value="none">なし</option>
                  <option value="sometimes">ときどき</option>
                  <option value="daily">毎日</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">運動頻度</label>
                <select className="w-full rounded border p-2"
                        value={activity} onChange={(e)=>setActivity(e.target.value)}>
                  <option value="lt1">週1以下</option>
                  <option value="1to3">週1〜3</option>
                  <option value="3to5">週3〜5</option>
                  <option value="gt5">週5以上</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">睡眠</label>
                <select className="w-full rounded border p-2"
                        value={sleep} onChange={(e)=>setSleep(e.target.value)}>
                  <option value="lt6">6h未満</option>
                  <option value="6to7">6〜7h</option>
                  <option value="7to8">7〜8h</option>
                  <option value="gt8">8h以上</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm mb-1">食事傾向</label>
                <select className="w-full rounded border p-2"
                        value={diet} onChange={(e)=>setDiet(e.target.value)}>
                  <option value="japanese">和食中心</option>
                  <option value="balanced">バランス型</option>
                  <option value="carbheavy">炭水化物多め</option>
                  <option value="fastfood">外食・加工多め</option>
                  <option value="proteinheavy">たんぱく多め</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <button type="submit" disabled={loading}
                className="w-full rounded bg-black text-white py-2 font-semibold disabled:opacity-60">
          {loading ? "診断中…" : "無料で今日の健康診断"}
        </button>
      </form>

      {error && <p className="mt-4 text-red-600">{error}</p>}

      {result && (
        <div className="mt-6 space-y-2 rounded border p-4">
          <p><span className="font-semibold">BMI：</span>{result.bmi}</p>
          <p><span className="font-semibold">判定：</span>{result.category}</p>
          <p><span className="font-semibold">ワンポイント：</span>{result.advice}</p>
          {result.tips?.length > 0 && (
            <ul className="list-disc pl-5">
              {result.tips.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          )}
          {result.note && <p className="text-sm text-gray-500">メモ：{result.note}</p>}
        </div>
      )}
    </main>
  );
}
