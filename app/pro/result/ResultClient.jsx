// app/pro/result/ResultClient.jsx
"use client";

import { useEffect, useState, useCallback } from "react";

export default function ResultClient({ profile }) {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState(null);

  const loadPlan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // ★ クライアント側でも “完全ノーキャッシュ”
      const res = await fetch("/api/ai-plan?ts=" + Date.now(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
        cache: "no-store",
        // Next.js 独自ヒント（あれば使われる）
        next: { revalidate: 0 },
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`API ${res.status}: ${t}`);
      }
      const data = await res.json();
      if (!data?.ok) throw new Error(data?.error || "unknown error");

      setPlan(data.plan || null);
    } catch (e) {
      setError(e?.message || String(e));
      setPlan(null);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    // マウント毎に必ず新規取得
    loadPlan();
  }, [loadPlan]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          onClick={loadPlan}
          className="px-3 py-2 rounded bg-black text-white disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "生成中…" : "メニューを再生成"}
        </button>
      </div>

      {error && (
        <div className="text-red-600 text-sm">
          エラー: {error}
        </div>
      )}

      {!error && !plan && (
        <div className="text-sm text-gray-600">読み込み中…</div>
      )}

      {plan && (
        <table className="w-full border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">曜日</th>
              <th className="border p-2">朝食</th>
              <th className="border p-2">昼食</th>
              <th className="border p-2">夕食</th>
              <th className="border p-2">運動</th>
              <th className="border p-2">Tips</th>
            </tr>
          </thead>
          <tbody>
            {["mon","tue","wed","thu","fri","sat","sun"].map((k) => {
              const jp = {mon:"月",tue:"火",wed:"水",thu:"木",fri:"金",sat:"土",sun:"日"}[k];
              const d = plan[k] || {};
              return (
                <tr key={k}>
                  <td className="border p-2 text-center">{jp}</td>
                  <td className="border p-2">{d.breakfast}</td>
                  <td className="border p-2">{d.lunch}</td>
                  <td className="border p-2">{d.dinner}</td>
                  <td className="border p-2">{d.workout}</td>
                  <td className="border p-2">{d.tips}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
