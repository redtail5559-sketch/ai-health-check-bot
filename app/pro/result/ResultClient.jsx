"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

function sanitizeEmail(v) {
  if (typeof v !== "string") return "";
  return v.trim().replace(/[\r\n\t]/g, "");
}

function getFromLocation() {
  if (typeof window === "undefined") return "";
  try {
    const usp = new URLSearchParams(window.location.search || "");
    return sanitizeEmail(usp.get("email") || "");
  } catch {
    return "";
  }
}

function getFromSession() {
  if (typeof window === "undefined") return "";
  try {
    return sanitizeEmail(sessionStorage.getItem("result.email") || "");
  } catch {
    return "";
  }
}

export default function ResultClient({ email: propsEmail = "" }) {
  const searchParams = useSearchParams();

  // 1) レンダー時点で取れるだけ取る
  const initial = useMemo(() => {
    const fromSP = sanitizeEmail(searchParams?.get("email") || "");
    const fromLoc = getFromLocation();
    const fromSS  = getFromSession();
    const fromProps = sanitizeEmail(propsEmail);
    // 優先順位：URL( useSearchParams / location ) > session > props
    return fromSP || fromLoc || fromSS || fromProps || "";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ← 初期化は一度だけ

  const [email, setEmail] = useState(initial);

  // 2) マウント後に再チェック（初回で空でもここで必ず埋める）
  useEffect(() => {
    if (email) return; // すでに入っていれば何もしない
    const fromSP = sanitizeEmail(searchParams?.get("email") || "");
    const fromLoc = getFromLocation();
    const fromSS  = getFromSession();
    const fromProps = sanitizeEmail(propsEmail);
    const resolved = fromSP || fromLoc || fromSS || fromProps || "";
    if (resolved) {
      setEmail(resolved);
    }
  // `searchParams`は参照だけ（変更監視は不要）。マウント一度で十分。
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 3) state 変更のたびに保存
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      sessionStorage.setItem("result.email", email || "");
      window.__RESULT_EMAIL = email || "";
    } catch {}
  }, [email]);

  const handleChange = (e) => {
    setEmail(sanitizeEmail(e.target.value));
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
            メールアドレスを入力してください（URLに <code>?email=</code> を付けても自動入力されます）
          </p>
        )}
      </div>
    </div>
  );
}
