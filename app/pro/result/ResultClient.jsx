// app/pro/result/ResultClient.jsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";

export default function ResultClient({ email: emailFromPage, report, profile }) {
  const sp = useSearchParams();
  const emailFromQuery = sp?.get("email") || "";

  // ✅ メールは「props → URLクエリ → localStorage」の優先順で必ずセット
  const [email, setEmail] = useState("");
  useEffect(() => {
    const fromLS =
      typeof window !== "undefined"
        ? window.localStorage.getItem("userEmail") || ""
        : "";
    const finalEmail = emailFromPage || emailFromQuery || fromLS || "";
    setEmail(finalEmail);
  }, [emailFromPage, emailFromQuery]);

  // ---- ここから下は既存の処理（必要最低限だけ） ----
  const [plan, setPlan] = useState(report || null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendMsg, setSendMsg] = useState("");
  const [error, setError] = useState(null);

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
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      if (!data?.ok) throw new Error(data?.error || "unknown error");
      setPlan(data.plan);
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }, [profile]);

  const sendPdfEmail = useCallback(async () => {
    if (!plan) return;
    setSending(true);
    setSendMsg("");
    try {
      const payload = {
        to: email || undefined,
        subject: "AI健康診断レポート",
        report: plan,
        profile,
      };
      const res = await fetch("/api/pdf-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // 空レスでも安全に処理
      const raw = await res.text();
      let data = null;
      try { data = raw ? JSON.parse(raw) : null; } catch { data = null; }

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `送信に失敗しました (${res.status})`);
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
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={loadPlan}
          className="px-3 py-2 rounded bg-black text-white disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "生成中…" : "メニューを再生成"}
        </button>

        {/* ✅ ここがポイント：props/URL/LS から決めた email を表示（編集不可） */}
        <input
          type="email"
          value={email}
          readOnly
          className="border rounded px-3 py-2 min-w-[280px] bg-gray-100 text-gray-700"
          title="購入時に入力したメールアドレス（編集不可）"
        />

        <button
          onClick={sendPdfEmail}
          className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
          disabled={!plan || !email || sending}
        >
          {sending ? "送信中…" : "PDFをメール送信"}
        </button>
      </div>

      {sendMsg && <div className="text-sm">{sendMsg}</div>}
      {error && <div className="text-red-600 text-sm">エラー: {error}</div>}

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
              const jp = { mon:"月", tue:"火", wed:"水", thu:"木", fri:"金", sat:"土", sun:"日" }[k];
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
