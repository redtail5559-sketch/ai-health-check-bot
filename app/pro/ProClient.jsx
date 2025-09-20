// app/pro/ProClient.jsx
"use client";

import { useState } from "react";

export default function ProClient() {
  const [loading, setLoading] = useState(false);

  const startCheckout = async () => {
    try {
      setLoading(true);

      // ← あなたのAPIルートに合わせて変更
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "ai-health-report" }),
      });

      if (!res.ok) throw new Error("failed to create checkout session");
      const { url } = await res.json(); // { url: session.url }
      window.location.href = url;
    } catch (e) {
      console.error(e);
      alert("決済画面を開けませんでした。少し待って再度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">AI健康診断Bot（有料版）</h1>
      <p className="mt-2 text-gray-600">
        決済完了後、専用レポートの生成ページへ自動で移動します。
      </p>

      <button
        onClick={startCheckout}
        disabled={loading}
        className="mt-6 inline-flex items-center rounded-lg bg-black px-5 py-3 text-white disabled:opacity-60"
      >
        {loading ? "決済画面へ移動中…" : "有料レポートを購入（Checkoutへ）"}
      </button>
    </main>
  );
}
