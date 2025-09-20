"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function CheckoutSuccessClient() {
  const router = useRouter();
  const sp = useSearchParams();

  useEffect(() => {
    const sid = sp.get("sid") || sp.get("session_id") || "";
    try { if (sid) sessionStorage.setItem("sessionId", sid); } catch {}
    const saved = typeof window !== "undefined" ? sessionStorage.getItem("sessionId") : "";
    router.replace(`/pro/success?sid=${encodeURIComponent(sid || saved || "")}`);
  }, [router, sp]);

  return null;
}
