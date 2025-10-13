"use client";
import { useEffect, useState } from "react";

export default function ResultClient({ email: propsEmail = "" }) {
  const [email, setEmail] = useState("");
  const [debug, setDebug] = useState("");

  // 初期セット：props or sessionStorage
  useEffect(() => {
    const fromSS =
      typeof window !== "undefined" ? sessionStorage.getItem("result.email") || "" : "";
    const initial = propsEmail || fromSS || "";
    setEmail(initial);
    try { sessionStorage.setItem("result.email", initial); } catch {}
    setDebug((d) => d + `初期email:${initial}\n`);
  }, [propsEmail]);

  // session_id / sessionId から復元
  useEffect(() => {
    if (email) {
      setDebug((d) => d + `既にemailあり:${email}\n`);
      return;
    }
    if (typeof window === "undefined") return;

    const usp = new URLSearchParams(window.location.search);
    const sid = usp.get("session_id") || usp.get("sessionId");
    if (!sid) {
      setDebug((d) => d + "URLにsession_idなし\n");
      return;
    }

    setDebug((d) => d + `API呼び出し開始:${sid}\n`);

    (async () => {
      try {
        const res = await fetch(`/api/checkout-session-lookup?session_id=${encodeURIComponent(sid)}`, { cache: "no-store" });
        const txt = await res.text();
        setDebug((d) => d + `API応答:${txt}\n`);
        let data = null;
        try { data = JSON.parse(txt); } catch {}
        const found = (data?.email || "").trim();
        if (found) {
          setEmail(found);
          try { sessionStorage.setItem("result.email", found); } catch {}
          setDebug((d) => d + `取得成功:${found}\n`);
        } else {
          setDebug((d) => d + "取得失敗(空)\n");
        }
      } catch (e) {
        setDebug((d) => d + "APIエラー:" + String(e) + "\n");
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

      {/* ↓ デバッグ表示 */}
      <pre className="text-xs bg-gray-100 p-2 whitespace-pre-wrap">{debug}</pre>
    </div>
  );
}
