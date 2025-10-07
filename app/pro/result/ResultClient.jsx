// app/pro/result/ResultClient.jsx
"use client";

import { useEffect, useState, useCallback } from "react";

export default function ResultClient({ profile }) {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState(null);

  // 送信系
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sendMsg, setSendMsg] = useState("");

  const loadPlan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai-plan?ts=" + Date.now(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
        cache: "no-store",
        next: { revalidate: 0 },
      });
      if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
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
    loadPlan();
  }, [loadPlan]);

  const sendPdfEmail = useCallback(async () => {
    if (!plan) return;
    setSending(true);
    setSendMsg("");
    try {
      const payload = {
        to: email && /\S+@\S+\.\S+/.test(email) ? email : undefined, // 空なら既定の送信先(info@...)に
        subject: "AI健康診断レポート",
        report: plan,   // ← /api/ai-plan の plan をそのまま渡す
        profile,        // ← 任意（PDFの先頭に概要として入る）
      };

      const res = await fetch("/api/pdf-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `send failed: ${res.status}`);
      }
      setSendMsg("PDFを添付して送信しました。メールをご確認ください。");
    } catch (e) {
      setSendMsg("送信エラー: " + (e?.message || String(e)));
    } finally {
      setSending(false);
    }
  }, [email, plan, profile]);

  return (
    <div className="space-y-4">
      {/* 操作列 */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={loadPlan}
          className="px-3 py-2 rounded bg-black text-white disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "生成中…" : "メニューを再生成"}
        </button>

        {/* メール送信UI */}
        <input
          type="email"
          placeholder="送信先メール（空なら既定のinfo@に送信）"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border rounded px-3 py-2 min-w-[280px]"
        />
        <button
          onClick={sendPdfEmail}
          className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
          disabled={!plan || sending}
        >
          {sending ? "送信中…" : "PDFをメール送信"}
        </button>
      </div>

      {sendMsg && <div className="text-sm">{sendMsg}</div>}

      {error && <div className="text-red-600 text-sm">エラー: {error}</div>}

      {!error && !plan && <div className="text-sm text-gray-600">読み込み中…</div>}

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
