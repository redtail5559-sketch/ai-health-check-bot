"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

function sanitizeEmail(v) {
  if (typeof v !== "string") return "";
  return v.trim().replace(/[\r\n\t]/g, "");
}

function getEmailFromLocation() {
  if (typeof window === "undefined") return "";
  try {
    const params = new URLSearchParams(window.location.search);
    return sanitizeEmail(params.get("email") || "");
  } catch {
    return "";
  }
}

export default function ResultClient({ email: propsEmail = "" }) {
  const searchParams = useSearchParams();

  // 初期化ロジック：複数ルートで確実に拾う
  const initialEmail = useMemo(() => {
    // 1) useSearchParams（通常ルート）
    const fromSearchParams = sanitizeEmail(searchParams?.get("email") || "");
    // 2) window.location（fallback）
    const fromLocation = getEmailFromLocation();
    // 3) sessionStorage（再訪問用）
    let fromSession = "";
    if (typeof window !== "undefined") {
      fromSession = sanitizeEmail(sessionStorage.getItem("result.email") || "");
    }
    // 4) props（親コンポーネント経由）
    const fromProps = sanitizeEmail(propsEmail);

    // 優先順位：URL > session > props > 空
    return fromSearchParams || fromLocation || fromSession || fromProps || "";
  }, [searchParams, propsEmail]);

  const [email, setEmail] = useState(initialEmail);

  // 初回同期
  useEffect(() => {
    if (typeof window === "undefined") return;
    const safe = sanitizeEmail(email);
    sessionStorage.setItem("result.email", safe);
    window.__RESULT_EMAIL = safe;
  }, [email]);

  // 入力時に同期
  const handleChange = (e) => {
    const v = sanitizeEmail(e.target.value);
    setEmail(v);
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("result.email", v);
        window.__RESULT_EMAIL = v;
      } catch {}
    }
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
            メールアドレスを入力してください（URLに ?email= を付けても自動入力されます）
          </p>
        )}
      </div>
    </div>
  );
}
