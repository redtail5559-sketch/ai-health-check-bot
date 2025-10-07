// app/pro/result/ResultClient.jsx
"use client";

import { useEffect, useState } from "react";

const JP = { mon: "月", tue: "火", wed: "水", thu: "木", fri: "金", sat: "土", sun: "日" };
const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DEFAULT_TIPS = [
  "水分を200ml×6〜8回こまめに",
  "就寝90分前の入浴で深部体温リズム調整",
  "タンパク質を毎食20g目安",
  "よく噛んで20分以上かけて食事",
  "昼休みに10分散歩で日光を浴びる",
  "間食は素焼きナッツか高カカオ",
  "寝る前は画面の光を控えめに",
];

function isReportReady(report) {
  return !!report && typeof report === "object" && !!report.mon;
}
function maskEmail(v = "") {
  const [name, domain] = v.split("@");
  if (!name || !domain) return v;
  return (name.slice(0, 2) + "****") + "@" + domain;
}

export default function ResultClient({ report = {}, email: initialEmail = "", debug }) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState(initialEmail); // ← 表示はせず、内部だけで保持

  // 1) 初回：クエリ > localStorage の順で採用（レポート画面には入力欄なし）
  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("userEmail", initialEmail);
      }
      return;
    }
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem("userEmail");
      if (saved) setEmail(saved);
    }
  }, [initialEmail]);

  // 2) 「送信先を変更」クリック時だけダイアログで入力
  const changeEmail = () => {
    if (typeof window === "undefined") return;
    const v = window.prompt("送信先メールアドレスを入力してください", email || "")?.trim() || "";
    if (!v) return;
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    if (!ok) {
      alert("メールアドレスの形式が正しくありません。");
      return;
    }
    setEmail(v);
    window.localStorage.setItem("userEmail", v);
  };

  const sendPdf = async () => {
    if (!isReportReady(report)) {
      alert("レポートを読み込み中です。数秒待ってからもう一度お試しください。");
      return;
    }
    const to = (email || "").trim();
    if (!to) {
      // 未設定ならまず設定してから
      changeEmail();
      if (!(window?.localStorage.getItem("userEmail") || "").trim()) return;
    }
    const dest = (email || window?.localStorage.getItem("userEmail") || "").trim();
    if (!dest) return;

    setSending(true);
    try {
      const res = await fetch("/api/pdf-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: dest, report }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "送信に失敗しました");
      setSent(true);
    } catch (e) {
      console.error("[pdf-email] send error:", e);
      alert(`送信エラー: ${e?.message || String(e)}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 本文：曜日ごとのカード */}
      {DAYS.map((d, idx) => {
        const v = report?.[d] || {};
        const tips = v.tips ?? DEFAULT_TIPS[idx % DEFAULT_TIPS.length];
        return (
          <div key={d} className="rounded-lg border bg-white p-4">
            <div className="mb-2 font-semibold">{JP[d]}曜日</div>
            <div className="space-y-1 text-sm">
              <div><span className="font-semibold">朝食：</span>{v.breakfast || "-"}</div>
              <div><span className="font-semibold">昼食：</span>{v.lunch || "-"}</div>
              <div><span className="font-semibold">夕食：</span>{v.dinner || "-"}</div>
              <div><span className="font-semibold">運動：</span>{v.workout || "-"}</div>
              <div className="text-xs text-gray-400">Tips: {tips}</div>
            </div>
          </div>
        );
      })}

      {/* 送信操作：メール欄は出さず、保存済みアドレスを使用 */}
      <div className="mb-28 mt-6 flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:justify-end">
        <div className="text-xs text-gray-500 sm:mr-2">
          送信先：{email ? maskEmail(email) : "（未設定）"}
          <button
            type="button"
            onClick={changeEmail}
            className="ml-2 underline hover:opacity-80"
          >
            変更
          </button>
        </div>
        <button
          onClick={sendPdf}
          disabled={sending}
          className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-60"
          title={!email ? "クリックして送信先を設定してください" : ""}
        >
          {sending ? "送信中…" : sent ? "送信しました" : "PDFをメールで送る"}
        </button>
      </div>
    );
}
