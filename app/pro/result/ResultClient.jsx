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
        const r = await fetch(`/api/pro-result?sessionId=${encodeURIComponent(sid)}&t=${Date.now()}`, {
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
  if (state.error)   return <main className="p-6 text-red-500">エラー: {state.error}</main>;

  const d = state.data;

  const buildTextReport = () => {
    const lines = [
      "AI健康レポート",
      "",
      `BMI: ${d.bmi ?? "-"}`,
      `概要: ${d.overview ?? "-"}`,
      "",
      "【1週間プラン】",
      ...(d.weekPlan || []).map((w) =>
        [
          `■ ${w.day}`,
          `  朝: ${w.meals?.breakfast ?? "-"}`,
          `  昼: ${w.meals?.lunch ?? "-"}`,
          `  夜: ${w.meals?.dinner ?? "-"}`,
          `  間: ${w.meals?.snack ?? "-"}`,
          `  運動: ${w.workout?.name ?? "-"} ${w.workout?.minutes ?? "-"}分`,
        ].join("\n")
      ),
    ];
    return lines.join("\n");
  };

  const handleSend = async () => {
    try {
      let to = d.email;
      if (!to) {
        to = window.prompt("送信先メールアドレスを入力してください") || "";
      }
      if (!to) {
        alert("メールアドレスが空です");
        return;
      }
      const res = await fetch(`/api/pdf-email?t=${Date.now()}&to=${encodeURIComponent(to)}`, { // ← クエリにも付与
  method: "POST",
  headers: { "Content-Type": "application/json" },
  cache: "no-store",
  body: JSON.stringify({
    to,                                // ← ボディにも入れる（保険で二重）
    subject: "AI健康レポート",
    report: buildTextReport(),
  }),
});
const json = await res.json();
if (!res.ok || !json?.ok) {
  alert("送信エラー詳細:\n" + JSON.stringify(json, null, 2));
  return;
}
alert("メール送信しました。受信ボックスをご確認ください。");

    } catch (e) {
      alert(`エラー: ${e.message}`);
    }
  };

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
          <div>送付先メール: {d.email || "(未設定)"}</div>
        </div>
      </section>

      <section className="border rounded-lg p-4 bg-white">
        <h2 className="font-semibold mb-2">総括</h2>
        <p className="text-gray-800 whitespace-pre-wrap">{d.overview}</p>
      </section>

      <section className="space-y-3 mt-6">
        <h2 className="text-lg font-semibold">1週間の食事・運動プラン</h2>
        <div className="space-y-3">
          {(d.weekPlan || []).map((w, i) => (
            <div key={i} className="border p-3 rounded">
              <h3 className="font-medium">{w.day}</h3>
              <p>朝食: {w.meals?.breakfast}</p>
              <p>昼食: {w.meals?.lunch}</p>
              <p>夕食: {w.meals?.dinner}</p>
              <p>間食: {w.meals?.snack}</p>
              <p>運動: {w.workout?.name} {w.workout?.minutes}分</p>
              <p className="text-sm text-gray-500">Tips: {w.workout?.tips}</p>
            </div>
          ))}
        </div>
      </section>

      {/* デバッグ情報の表示（AI が使われているか一目で分かる） */}
      <section className="text-xs text-gray-500">
        <pre className="bg-gray-50 p-3 rounded overflow-auto">
{JSON.stringify(d.__debug, null, 2)}
        </pre>
      </section>

      <button onClick={handleSend} className="rounded bg-black text-white px-5 py-3">
        PDFをメールで送る
      </button>
    </main>
  );
}
