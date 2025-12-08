"use client";

import { useState, useEffect } from "react";

export default function ProClient() {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    heightCm: "",
    weightKg: "",
    age: "",
    sex: "",
    activity: "",
    sleep: "",
    drink: "",
    smoke: "",
    diet: "",
    goal: "",
    email: "",
  });

  useEffect(() => {
    const savedEmail = localStorage.getItem("userEmail");
    if (savedEmail) {
      setForm((prev) => ({ ...prev, email: savedEmail }));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === "email") {
      localStorage.setItem("userEmail", value);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault(); // ✅ required属性のバリデーションを先に通す

    console.log("✅ Checkout button clicked");

    try {
      setLoading(true);

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          goals: form.goal ? [form.goal] : [],
        }),
      });

      console.log("✅ fetch response status:", res.status);

      if (!res.ok) {
        const fallbackText = await res.text();
        throw new Error(`APIエラー: ${fallbackText}`);
      }

      const data = await res.json();
      console.log("✅ Stripe response:", data);

      if (!data.checkouturl) {
        throw new Error("checkout URL not returned");
      }

      window.location.href = data.checkouturl;
    } catch (e) {
      console.error("❌ 決済エラー:", e);
      alert(`決済画面を開けませんでした。詳細: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">AI健康チェックBot（有料版）</h1>
      <p className="mt-2 text-gray-600">決済完了後、専用レポートの生成を開始します。</p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        {[
          ["heightCm", "身長（cm）"],
          ["weightKg", "体重（kg）"],
          ["age", "年齢"],
        ].map(([key, label]) => (
          <div key={key}>
            <label className="block text-sm font-medium">{label}</label>
            <input
              type="text"
              name={key}
              value={form[key]}
              onChange={handleChange}
              className="mt-1 block w-full border rounded px-3 py-2"
              placeholder={label}
              required
            />
          </div>
        ))}

        {[
          ["sex", "性別", ["男性", "女性", "その他"]],
          ["activity", "運動習慣", ["なし", "週1〜2回", "週3回以上"]],
          ["sleep", "睡眠時間", ["5時間未満", "5〜7時間", "7時間以上"]],
          ["drink", "飲酒習慣", ["なし", "週1〜2回", "ほぼ毎日"]],
          ["smoke", "喫煙習慣", ["なし", "時々", "毎日"]],
          ["diet", "食生活", ["偏りあり", "普通", "バランス良好"]],
        ].map(([key, label, options]) => (
          <div key={key}>
            <label className="block text-sm font-medium">{label}</label>
            <select
              name={key}
              value={form[key]}
              onChange={handleChange}
              className="mt-1 block w-full border rounded px-3 py-2"
              required
            >
              <option value="">選択してください</option>
              {options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        ))}

        <div>
          <label className="block text-sm font-medium">目標（日本語で）</label>
          <input
            type="text"
            name="goal"
            value={form.goal}
            onChange={handleChange}
            className="mt-1 block w-full border rounded px-3 py-2"
            placeholder="例：健康的な生活を送りたい"
            lang="ja"
            inputMode="kana"
            autoCapitalize="none"
            autoCorrect="off"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">メールアドレス</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className="mt-1 block w-full border rounded px-3 py-2"
            placeholder="you@example.com"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 inline-flex items-center rounded-lg bg-black px-5 py-3 text-white disabled:opacity-60"
        >
          {loading ? "決済画面へ移動中…" : "有料ボットを購入（Checkoutへ）"}
        </button>
      </form>
    </main>
  );
}