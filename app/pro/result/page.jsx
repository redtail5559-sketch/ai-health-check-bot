// app/pro/result/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function Success() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("ready");

  async function sendPdf() {
    try {
      setSending(true);
      setStatus("sending");

      const sessionId = searchParams.get("session_id") || "";
      const res = await fetch("/api/pdf-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, report: "Paid report text" }),
      });

      if (!res.ok) throw new Error("failed");
      setStatus("sent");
    } catch (e) {
      console.error(e);
      setStatus("error");
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    // 例: 初回表示で自動送信したい場合
    // void sendPdf();
  }, []);

  return (
    <main style={{ padding: 24 }}>
      <h1>Payment Success</h1>
      <p>session_id: {searchParams.get("session_id") || "(none)"}</p>
      <button onClick={sendPdf} disabled={sending}>
        {sending ? "Sending..." : "Send Paid PDF"}
      </button>
      <p>Status: {status}</p>
      <button onClick={() => router.push("/")}>Back to Home</button>
    </main>
  );
}
