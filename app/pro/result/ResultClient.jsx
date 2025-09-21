// app/pro/result/ResultClient.jsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function ResultClient() {
  const sp = useSearchParams();
  const [state, setState] = useState({ loading: true, error: "", data: null });

  useEffect(() => {
    const sid = sp.get("sessionId") || "";
    (async () => {
      try {
        const r = await fetch(`/api/pro-result?sessionId=${encodeURIComponent(sid)}`, {
          cache: "no-store",
        });
        const j = await r.json();
        if (!j.ok) throw new Error(j.error || "failed");
        setState({ loading: false, error: "", data: j.data });
      } catch (e) {
        setState({ loading: false, error: e.message, data: null });
      }
    })();
  }, [sp]);

  if (state.loading) return <main className="p-6">レポート生成中…</main>;
  if (state.error) return <main className="p-6 text-red-500">エラー: {state.error}</main>;

  const d = state.data;

  return (
    <main className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">有料レポート</h1>

      <section className="border rounded-lg p-4 bg-white">
        <h2 className="font-semibold mb-2">プロフィール</h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-700">
          <div>身長: {d.profile.heightCm} cm</div>
          <div>体重: {d.profile.weightKg} kg</div>
          <div>年齢: {d.profile.age}</div>
          <div>性別: {d.profile.sex}</div>
          <div>運動量: {d.profile.activity}</div>
          <div>睡眠: {d.profile.sleep}</div>
          <div>飲酒: {d.profile.drink}</div>
          <div>喫煙: {d.profile.smoke}</div>
          <div>食事傾向: {d.profile.diet}</div>
          <div>送付先メール: {d.email}</div>
        </div>
      </section>

      <section className="border rounded-lg p-4 bg-white">
        <h2 className="font-semibold mb-2">総括</h2>
        <p className="text-gray-800">{d.overview}</p>
      </section>

      <section className="border rounded-lg p-4 bg-white">
        <h2 className="font-semibold mb-3">1週間の食事・運動プラン</h2>
        <div className="space-y-3">
          {d.weekPlan.map((day, i) => (
            <div key={i} className="border rounded p-3">
              <h3 className="font-medium">{day.day}</h3>
              <p>朝食: {day.meals.breakfast}</p>
              <p>昼食: {day.meals.lunch}</p>
              <p>夕食: {day.meals.dinner}</p>
              <p>間食: {day.meals.snack}</p>
              <p>
                運動: {day.workout.name} {day.workout.minutes}分（{day.workout.intensity}）
              </p>
              <p className="text-sm text-gray-500">Tips: {day.workout.tips}</p>
            </div>
          ))}
        </div>
      </section>

      <button
        onClick={async () => {
          await fetch("/api/pdf-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId: d.sessionId, report: JSON.stringify(d) }),
          });
          alert("PDF作成＆メール送信を開始しました。数分お待ちください。");
        }}
        className="rounded bg-black text-white px-5 py-3"
      >
        PDFをメールで送る
      </button>
    </main>
  );
}
