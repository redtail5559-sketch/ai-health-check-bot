// app/pro/checkout/success/page.jsx
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function CheckoutSuccess() {
  const router = useRouter();
  const sp = useSearchParams();

  useEffect(() => {
    const sid = sp.get("sid") || "";
    try { if (sid) sessionStorage.setItem("sessionId", sid); } catch {}
    if (sid) {
      router.replace(`/pro/result?sessionId=${encodeURIComponent(sid)}`);
    } else {
      const saved = typeof window !== "undefined" ? sessionStorage.getItem("sessionId") : "";
      router.replace(`/pro/result?sessionId=${encodeURIComponent(saved || "")}`);
    }
  }, [router, sp]);

  return <main className="p-6">お支払い完了。結果ページに移動します…</main>;
}
