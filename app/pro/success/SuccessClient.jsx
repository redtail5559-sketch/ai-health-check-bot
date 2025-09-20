// app/pro/success/SuccessClient.jsx
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SuccessClient() {
  const router = useRouter();
  const sp = useSearchParams();

  useEffect(() => {
    const sid =
      sp.get("sid") ||           // 自前で渡す場合
      sp.get("session_id") || ""; // Stripeの {CHECKOUT_SESSION_ID}

    try {
      if (sid) sessionStorage.setItem("sessionId", sid);
    } catch {}

    const saved =
      typeof window !== "undefined" ? sessionStorage.getItem("sessionId") : "";

    const sessionId = sid || saved || "";
    router.replace(`/pro/result?sessionId=${encodeURIComponent(sessionId)}`);
  }, [router, sp]);

  return <main className="p-6">お支払い完了。結果ページに移動します…</main>;
}
