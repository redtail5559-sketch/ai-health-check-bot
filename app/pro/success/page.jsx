// app/pro/success/page.jsx
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function Success() {
  const router = useRouter();
  const sp = useSearchParams();

  useEffect(() => {
    const sid = sp.get("sid") || "";
    // sidを保存（復旧用）
    try {
      if (sid) sessionStorage.setItem("sessionId", sid);
    } catch {}
    const sessionId =
      sid || (typeof window !== "undefined" ? sessionStorage.getItem("sessionId") || "" : "");

    router.replace(`/pro/result?sessionId=${encodeURIComponent(sessionId)}`);
  }, [router, sp]);

  return <main className="p-6">決済ありがとうございます。レポートに移動します…</main>;
}
