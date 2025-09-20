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
    if (!form.heightCm || !form.weightKg || !form.email) {
      alert("身長・体重・メールは必須です。");
      return;
    }
    try {
      setLoading(true);
      sessionStorage.setItem("proForm", JSON.stringify(form));

      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "failed to create checkout session");
      }
      const { url } = await res.json();
      window.location.href = url;
    } catch (err) {
      console.error(err);
      alert("決済画面を開けませんでした。詳細: " + (err.message || "unknown"));
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
          <input type="number" min="50" max="250" placeholder="身長(cm)*" value={form.heightCm} onChange={onChange("heightCm")} className="border p-3 rounded" required />
          <input type="number" min="20" max="200" placeholder="体重(kg)*" value={form.weightKg} onChange={onChange("weightKg")} className="border p-3 rounded" required />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input type="number" min="1" max="120" placeholder="年齢（任意）" value={form.age} onChange={onChange("age")} className="border p-3 rounded" />
          <select value={form.sex} onChange={onChange("sex")} className="border p-3 rounded">
            <option value="">性別（任意）</option>
            <option value="男性">男性</option>
            <option value="女性">女性</option>
            <option value="その他">その他</option>
          </select>
        </div>

        <select value={form.activity} onChange={onChange("activity")} className="border p-3 rounded">
          <option value="">運動量（任意）</option>
          <option value="ほぼなし">ほぼなし</option>
          <option value="週2-3回">週2-3回</option>
          <option value="週4回以上">週4回以上</option>
        </select>

        <select value={form.sleep} onChange={onChange("sleep")} className="border p-3 rounded">
          <option value="">睡眠時間（任意）</option>
          <option value="〜5時間">〜5時間</option>
          <option value="6-7時間">6–7時間</option>
          <option value="8時間以上">8時間以上</option>
        </select>

        <select value={form.drink} onChange={onChange("drink")} className="border p-3 rounded">
          <option value="">飲酒（任意）</option>
          <option value="なし">なし</option>
          <option value="週1-2回">週1–2回</option>
          <option value="週3回以上">週3回以上</option>
        </select>

        <select value={form.smoke} onChange={onChange("smoke")} className="border p-3 rounded">
          <option value="">喫煙（任意）</option>
          <option value="なし">なし</option>
          <option value="ときどき">ときどき</option>
          <option value="毎日">毎日</option>
        </select>

       // app/pro/ProFormClient.jsx のフォーム内 該当箇所だけ差し替え
       <select value={form.diet} onChange={onChange("diet")} className="border p-3 rounded">
       <option value="">食事の傾向（任意）</option>
       <option value="バランス型">バランス型</option>
       <option value="炭水化物多め">炭水化物多め</option>
       <option value="たんぱく質意識">たんぱく質意識</option>
       <option value="外食・コンビニ多め">外食・コンビニ多め</option>
       <option value="野菜少なめ">野菜少なめ</option>
       <option value="低糖質・糖質制限">低糖質・糖質制限</option>
       <option value="間食多め">間食多め</option>
</select>
 
        <input type="email" placeholder="購入メール（送付先）*" value={form.email} onChange={onChange("email")} className="border p-3 rounded" required />

        <button disabled={loading} className="rounded bg-black text-white px-5 py-3 disabled:opacity-60">
          {loading ? "Checkoutに遷移中…" : "診断に進む（決済へ）"}
        </button>
      </form>
    </main>
  );
}
