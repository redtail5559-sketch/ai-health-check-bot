// app/pro/result/ResultClient.jsx
"use client";
import { useEffect, useState } from "react";

export default function ResultClient({ email: propsEmail = "" }) {
  const [email, setEmail] = useState("");

  // 初期：props or sessionStorage
  useEffect(() => {
    const fromSS =
      typeof window !== "undefined" ? sessionStorage.getItem("result.email") || "" : "";
    const initial = propsEmail || fromSS || "";
    setEmail(initial);
    try { sessionStorage.setItem("result.email", initial); } catch {}
  }, [propsEmail]);

  // ★ 追加：session_id から復元
  useEffect(() => {
    if (email) return; // 既に入っていれば不要
    if (typeof window === "undefined") return;

    const usp = new URLSearchParams(window.location.search);
    const sid = usp.get("session_id");
    if (!sid) return;

    (async () => {
      try {
        const res = await fetch(`/api/checkout-session-lookup?session_id=${encodeURIComponent(sid)}`, { cache: "no-store" });
        const data = await res.json();
        const found = (data?.email || "").trim();
        if (found) {
          setEmail(found);
          try { sessionStorage.setItem("result.email", found); } catch {}
        }
      } catch (e) {
        // 失敗しても静かに無視（手入力できるように）
        console.error("session lookup failed", e);
      }
    })();
  }, [email]);

  const onChange = (e) => {
    const v = (e.target.value || "").trim();
    setEmail(v);
    try { sessionStorage.setItem("result.email", v); } catch {}
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          レポート送付先メールアドレス
        </label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="your@example.com"
          className="w-full rounded border px-3 py-2"
          value={email}
          onChange={onChange}
        />
      </div>
    </div>
  );
}
