"use client";
import { useState } from "react";
import Link from "next/link";

export default function Page() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  // 入力状態
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("male");
  const [goal, setGoal] = useState(""); // ← 追加

  const [drink, setDrink] = useState("none");
  const [smoke, setSmoke] = useState("none");
  const [activity, setActivity] = useState("lt1");
  const [sleep, setSleep] = useState("6to7");
  const [diet, setDiet] = useState("japanese");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);

    const fd = new FormData(e.currentTarget);
    const h = Number(fd.get("heightCm"));
    const w = Number(fd.get("weightKg"));
    const ageVal = fd.get("age") ? Number(fd.get("age")) : undefined;
    const sexVal = fd.get("sex") || undefined;
    const goalVal = fd.get("goal")?.trim(); // ← 追加

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

    if (!goalVal) {
      setError("目的を入力してください。");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/free-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heightCm: h,
          weightKg: w,
          age: ageVal,
          sex: sexVal,
          lifestyle,
          goal: goalVal, // ← 追加
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
        {/* 身長 */}
        <div>
          <label htmlFor="heightCm" className="block text-sm mb-1">身長（cm）</label>
          <input
            id="heightCm"
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

        {/* 体重 */}
        <div>
          <label htmlFor="weightKg" className="block text-sm mb-1">体重（kg）</label>
          <input
            id="weightKg"
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

        {/* 年齢・性別 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="age" className="block text-sm mb-1">年齢（任意）</label>
            <input
              id="age"
              name="age"
              type="number"
              min="0"
              placeholder="例）45"
              className="w-full rounded border p-2"
              value={age ?? ""}
              onChange={(e) => setAge(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="sex" className="block text-sm mb-1">性別（任意）</label>
            <select
              id="sex"
              name="sex"
              className="w-full rounded border p-2"
              value={sex ?? ""}
              onChange={(e) => setSex(e.target.value)}
            >
              <option value="">（任意）</option>
              <option value="male">男性</option>
              <option value="female">女性</option>
            </select>
          </div>
        </div>

        {/* 目的（必須） */}
        <div>
          <label htmlFor="goal" className="block text-sm mb-1">目的（必須）</label>
          <input
            id="goal"
            name="goal"
            type="text"
            placeholder="例）体重を減らしたい"
            className="w-full rounded border p-2"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            required
          />
        </div>

        {/* 詳細（任意） */}
        {/* ここは元のままでOK */}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-black text-white py-2 font-semibold disabled:opacity-60"
        >
          {loading ? "診断中..." : "無料で今日の健康診断"}
        </button>
      </form>

      {/* 結果・エラー・戻るリンクは元のままでOK */}
    </main>
  );
}