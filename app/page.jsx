// app/page.jsx
"use client";
import { useState } from "react";

export default function Page() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  // 入力値（最低限：身長・体重。その他は任意）
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("male"); // "male" | "female"

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

      <form onSubmit={onSubmit} className="space-y-4 rounded border p-4">
        <div>
          <label className="block text-sm mb-1">身長（cm）</label>
          <input
            name="heightCm"
            type="number"
            inputMode="decimal"
            step="0.1"
            min="1"
            placeholder="例）170"
            className="w-full rounded border p-2"
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1">体重（kg）</label>
          <input
            name="weightKg"
            type="number"
            inputMode="decimal"
            step="0.1"
            min="1"
            placeholder="例）65"
            className="w-full rounded border p-2"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">年齢（任意）</label>
            <input
              name="age"
              type="number"
              min="0"
              placeholder="例）45"
              className="w-full rounded border p-2"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">性別（任意）</label>
            <select
              name="sex"
              className="w-full rounded border p-2"
              value={sex}
              onChange={(e) => setSex(e.target.value)}
            >
              <option value="male">男性</option>
              <option value="female">女性</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-black text-white py-2 font-semibold disabled:opacity-60"
        >
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
          {result.note && (
            <p className="text-sm text-gray-500">メモ：{result.note}</p>
          )}
        </div>
      )}
    </main>
  );
}
