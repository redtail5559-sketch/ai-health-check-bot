// app/pro/ProFormClient.jsx
"use client";

import { useState } from "react";

export default function ProFormClient() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    heightCm: "", weightKg: "", age: "", sex: "",
    drink: "", smoke: "", activity: "", sleep: "", diet: "", email: "",
  });

  const onChange = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      sessionStorage.setItem("proForm", JSON.stringify(form));

      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("failed to create session");
      const { url } = await res.json();
      window.location.href = url;
    } catch (err) {
      console.error(err);
      alert("決済画面を開けませんでした。時間をおいてお試しください。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">AI健康診断Bot（有料版）</h1>
      <p className="text-gray-600 mt-2">入力→決済→結果→PDFメールまで自動でお届け。</p>

      <form onSubmit={onSubmit} className="mt-6 grid gap-4">
        <div className="grid grid-cols-2 gap-3">
          <input placeholder="身長(cm)" value={form.heightCm} onChange={onChange("heightCm")} className="border p-3 rounded" />
          <input placeholder="体重(kg)" value={form.weightKg} onChange={onChange("weightKg")} className="border p-3 rounded" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input placeholder="年齢" value={form.age} onChange={onChange("age")} className="border p-3 rounded" />
          <input placeholder="性別（任意）" value={form.sex} onChange={onChange("sex")} className="border p-3 rounded" />
        </div>

        <input placeholder="飲酒例: 週2回/350ml×2" value={form.drink} onChange={onChange("drink")} className="border p-3 rounded" />
        <input placeholder="喫煙例: なし/1日10本" value={form.smoke} onChange={onChange("smoke")} className="border p-3 rounded" />
        <input placeholder="運動例: 週2回 30分早歩き" value={form.activity} onChange={onChange("activity")} className="border p-3 rounded" />
        <input placeholder="睡眠例: 6時間" value={form.sleep} onChange={onChange("sleep")} className="border p-3 rounded" />
        <input placeholder="食事例: 夜食あり/野菜少なめ" value={form.diet} onChange={onChange("diet")} className="border p-3 rounded" />
        <input type="email" placeholder="購入メール（レポート送付先）" value={form.email} onChange={onChange("email")} className="border p-3 rounded" required />

        <button disabled={loading} className="rounded bg-black text-white px-5 py-3 disabled:opacity-60">
          {loading ? "Checkoutに遷移中…" : "診断に進む（決済へ）"}
        </button>
      </form>
    </main>
  );
}
