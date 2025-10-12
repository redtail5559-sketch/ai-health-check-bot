"use client";
import { useEffect, useState } from "react";

export default function ResultClient({ email: propsEmail = "" }) {
  const [email, setEmail] = useState("");

  // 初期値は props か sessionStorage から
  useEffect(() => {
    const fromSS =
      typeof window !== "undefined"
        ? sessionStorage.getItem("result.email") || ""
        : "";
    const initial = propsEmail || fromSS || "";
    setEmail(initial);
    try {
      sessionStorage.setItem("result.email", initial);
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
      </div>
    </div>
  );
}
