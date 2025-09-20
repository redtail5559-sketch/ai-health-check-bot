"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function ResultClient() {
  const sp = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const sessionId = sp.get("sessionId") || "";
    (async () => {
      try {
        setStatus("loading");
        // ここで sessionId を使ってサーバーからレポート取得 or メール送信など
        // 例:
        // const r = await fetch(`/api/ai-plan?sessionId=${encodeURIComponent(sessionId)}`);
        // const json = await r.json();
        // setReport(json);
        setReport({ ok: true }); // 仮
        setStatus("done");
      } catch (e) {
        setError(e?.message || "unknown error");
        setStatus("error");
      }
    })();
  }, [sp]);

  if (status === "loading") return <main className="p-6">レポートを生成中…</main>;
  if (status === "error") return <main className="p-6 text-red-500">エラー: {error}</main>;

  return (
    <main className="p-6">
      <h1 className="text-xl font-bold">有料レポート</h1>
      <pre className="mt-4 p-3 bg-gray-100 rounded">{JSON.stringify(report, null, 2)}</pre>
    </main>
  );
}
