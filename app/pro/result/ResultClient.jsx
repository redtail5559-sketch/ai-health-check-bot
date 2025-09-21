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
      <h1 className="text-2xl font-bold">AI健康診断bot　診断レポート</h1>

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

     {/* 1週間の食事・運動プラン */}
<section className="space-y-3 mt-6">
  <h2 className="text-lg font-semibold">1週間の食事・運動プラン</h2>

  <div className="space-y-3">
    {(state.data?.weekPlan || []).map((d, i) => (
      <div key={i} className="border p-3 rounded">
        <h3 className="font-medium">{d.day}</h3>
        <p>朝食: {d.meals?.breakfast}</p>
        <p>昼食: {d.meals?.lunch}</p>
        <p>夕食: {d.meals?.dinner}</p>
        <p>間食: {d.meals?.snack}</p>
        <p>運動: {d.workout?.name} {d.workout?.minutes}分（{d.workout?.intensity}）</p>
        <p className="text-sm text-gray-500">Tips: {d.workout?.tips}</p>
      </div>
    ))}
  </div>
</section>
 
<button
  onClick={async () => {
    try {
      const r = await fetch("/api/pdf-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: d.sessionId,
          email: d.email,   // 宛先
          report: d,        // レポート本体（API側で stringify します）
        }),
      });

      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || "送信エラー");
      alert("PDF作成＆メール送信を開始しました。数分お待ちください。");
    } catch (e) {
      alert(`エラー: ${e.message}`);
    }
  }}
  className="rounded bg-black text-white px-5 py-3"
>
  PDFをメールで送る
</button>

    </main>
  );
}
