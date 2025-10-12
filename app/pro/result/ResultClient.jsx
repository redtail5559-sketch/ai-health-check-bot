"use client";

import { useEffect, useState } from "react";

useEffect(() => {
  console.log("=== DEBUG EMAIL ===");
  console.log("window.location.href:", typeof window !== "undefined" ? window.location.href : "(no window)");
  console.log("props.email:", propsEmail);
  console.log("sessionStorage.result.email:", typeof window !== "undefined" ? sessionStorage.getItem("result.email") : "(no window)");
}, []);

export default function ResultClient({ email: propsEmail = "" }) {
  const [email, setEmail] = useState("");

  // 初回マウント時に props または sessionStorage から確実に読み込む
  useEffect(() => {
    let resolved = "";
    try {
      const fromSS = sessionStorage.getItem("result.email") || "";
      resolved = propsEmail || fromSS || "";
    } catch {
      resolved = propsEmail || "";
    }
    setEmail(resolved);
    try {
      sessionStorage.setItem("result.email", resolved);
    } catch {}
  }, [propsEmail]);

  const handleChange = (e) => {
    const v = e.target.value.trim();
    setEmail(v);
    try {
      sessionStorage.setItem("result.email", v);
    } catch {}
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
          onChange={handleChange}
        />
        {!email && (
          <p className="mt-2 text-xs text-red-600">
            メールアドレスを入力してください
          </p>
        )}
      </div>
    </div>
  );
}
