"use client";
import { useEffect, useState } from "react";

export default function ResultClient({ email: propsEmail = "" }) {
  const [email, setEmail] = useState("");
  const [debug, setDebug] = useState("");

  // ✅ AIプラン生成用ステート
  const [plan, setPlan] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fromSS =
      typeof window !== "undefined" ? sessionStorage.getItem("result.email") || "" : "";
    const initial = propsEmail || fromSS || "";
    setEmail(initial);
    try { sessionStorage.setItem("result.email", initial); } catch {}
    setDebug((d) => d + `初期email:${initial}\n`);
  }, [propsEmail]);

  useEffect(() => {
    if (email) { setDebug((d) => d + `既にemailあり:${email}\n`); return; }
    if (typeof window === "undefined") return;
    const usp = new URLSearchParams(window.location.search);
    const sid = usp.get("session_id") || usp.get("sessionId");
    if (!sid) { setDebug((d) => d + "URLにsession_idなし\n"); return; }

    setDebug((d) => d + `API呼び出し開始:${sid}\n`);
    (async () => {
      try {
        const res = await fetch(`/api/checkout-session-lookup?session_id=${encodeURIComponent(sid)}`, { cache: "no-store" });
        const txt = await res.text();
        setDebug((d) => d + `API応答:${txt}\n`);
        let data = null; try { data = JSON.parse(txt); } catch {}
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

  useEffect(() => {
    async function fetchPlan() {
      try {
        setLoading(true);
        setError("");
        setDebug((d) => d + "AIプラン生成開始\n");
        const payload = { input: "糖質控えめ・高たんぱくでお願いします", profile: { age: 42, sex: "male", goal: "脂肪減少" } };
        const res = await fetch("/api/ai-plan", {
          method: "POST",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (json.ok) { setDebug((d) => d + "AIプラン取得成功\n"); setPlan(json.plan); }
        else { throw new Error(json.error || "AIプラン取得に失敗しました"); }
      } catch (e) {
        setError(String(e));
        setDebug((d) => d + `AIプランエラー:${e}\n`);
      } finally {
        setLoading(false);
      }
    }
    fetchPlan();
  }, []);

  const onChange = (e) => {
    const v = (e.target.value || "").trim();
    setEmail(v);
    try { sessionStorage.setItem("result.email", v); } catch {}
  };

  return (
    <div className="pro-result">
      <div className="header">
        <img src="/icon.png" alt="" width={36} height={36} />
        <h1>AIヘルス週次プラン</h1>
      </div>
      <div className="subtitle">食事とワークアウトの7日メニュー</div>

      <div className="toolbar">
        <button className="btn" type="button" onClick={() => location.reload()}>
          メニューを再生成
        </button>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="送信先メール（空なら既定のinfo@〜に送）"
          className="input"
          value={email}
          onChange={onChange}
        />
        <button className="btn primary" type="button" disabled={loading}>
          PDFをメール送信
        </button>
      </div>

      {error && <div className="alert">エラー: {error}</div>}

      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">AIヘルス週次プラン</h2>
        {loading && <p>AIがプランを生成中です...</p>}
        {!loading && !error && plan.length > 0 && (
          <ul className="list-disc ml-6 text-sm">
            {plan.map((line, i) => <li key={i}>{line}</li>)}
          </ul>
        )}
      </div>

      <pre className="text-xs bg-gray-100 p-2 whitespace-pre-wrap">{debug}</pre>
    </div>
  );
}
