"use client";

import { useState, useEffect } from "react";

export default function ProClient() {
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null); // ✅ 通知用ステート追加

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
    event.preventDefault();

    console.log("✅ Checkout button clicked");

    try {
      setLoading(true);
      setNotice(null);

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
        throw new Error("決済URLが取得できませんでした");
      }

      // ✅ StripeのCheckoutへ遷移
      window.location.href = data.checkouturl;
    } catch (e) {
      console.error("❌ 決済エラー:", e);
      // ✅ alertを廃止してページ内通知に変更
      setNotice("決済画面を開けませんでした。ご利用の環境やネットワークをご確認ください。\n詳細: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">AI健康チェックBot（有料版）</h1>
      <p className="mt-2 text-gray-600">決済完了後、専用レポートの生成を開始します。</p>

      {/* ✅ 通知表示（alertの代替） */}
      {notice && (
        <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
          {notice}
        </div>
      )}

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        {/* 入力フォーム部分はそのまま */}
        {[["heightCm", "身長（cm）"], ["weightKg", "体重（kg）"], ["age", "年齢"]].map(([key, label]) => (
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

        {/* 省略: sex, activity, sleep, drink, smoke, diet の select 部分 */}
        {/* goal, email, button 部分もそのまま */}
      </form>
    </main>
  );
}