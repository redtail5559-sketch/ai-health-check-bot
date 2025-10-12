"use client";

import { useEffect, useMemo, useState } from "react";

function sanitize(v) {
  if (typeof v !== "string") return "";
  return v.trim().replace(/[\r\n\t]/g, "");
}

function getFromLocation() {
  if (typeof window === "undefined") return "";
  try {
    const usp = new URLSearchParams(window.location.search || "");
    return sanitize(usp.get("email") || "");
  } catch {
    return "";
  }
}

function getFromSession() {
  if (typeof window === "undefined") return "";
  try {
    return sanitize(sessionStorage.getItem("result.email") || "");
  } catch {
    return "";
  }
}

export default function ResultClient({ email: propsEmail = "" }) {
  // --- 1) 初期取り ---
  const initial = useMemo(() => {
    const fromLoc = getFromLocation();
    const fromSS  = getFromSession();
    const fromProps = sanitize(propsEmail);
    return fromLoc || fromSS || fromProps || "";
  }, [propsEmail]);

  const [email, setEmail] = useState(initial);

  // --- 2) マウント後の再解決（空なら再試行） ---
  useEffect(() => {
    if (email) return;
    const fromLoc = getFromLocation();
    const fromSS  = getFromSession();
    const fromProps = sanitize(propsEmail);
    const resolved = fromLoc || fromSS || fromProps || "";
    if (resolved) setEmail(resolved);
  }, [email, propsEmail]);

  // --- 3) 永続化 ---
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      sessionStorage.setItem("result.email", email || "");
      window.__RESULT_EMAIL = email || "";
    } catch {}
  }, [email]);

  // --- 4) 画面帯で“今見えている値”を強制表示（8秒で自動非表示） ---
  const [showDiag, setShowDiag] = useState(true);
  const diag = {
    href:
      typeof window !== "undefined" ? window.location.href : "(no window)",
    propsEmail,
    fromLocation: getFromLocation(),
    fromSession: getFromSession(),
    stateEmail: email,
  };
  useEffect(() => {
    const t = setTimeout(() => setShowDiag(false), 8000);
    return () => clearTimeout(t);
  }, []);

  const handleChange = (e) => setEmail(sanitize(e.target.value));

  return (
    <div className="w-full">
      {showDiag && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            background: "#fee2e2",
            color: "#b91c1c",
            fontSize: 12,
            padding: "6px 10px",
            borderBottom: "1px solid #fecaca",
            wordBreak: "break-all",
          }}
        >
          <strong>DEBUG</strong>{" "}
          <span>href={diag.href}</span>{" "}
          <span> | props={diag.propsEmail || "(empty)"} </span>{" "}
          <span> | loc={diag.fromLocation || "(empty)"} </span>{" "}
          <span> | ss={diag.fromSession || "(empty)"} </span>{" "}
          <span> | state={diag.stateEmail || "(empty)"} </span>
        </div>
      )}

      <div className="mb-4 mt-10">
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
            メールアドレスを入力してください（URLに ?email= を付けると自動入力）
          </p>
        )}
      </div>
    </div>
  );
}
