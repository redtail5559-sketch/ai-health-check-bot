"use client";
import { useEffect, useState } from "react";

export default function ResultClient({ email: propsEmail = "" }) {
  const [email, setEmail] = useState("");
  const [debug, setDebug] = useState("");

  // ✅ AIプラン生成用ステート
  const [plan, setPlan] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ✅ 送信ステート
  const [sending, setSending] = useState(false);
  const [sentOK, setSentOK] = useState(false);

  /* ---------------- 初期セット：props or sessionStorage ---------------- */
  useEffect(() => {
    const fromSS =
      typeof window !== "undefined" ? sessionStorage.getItem("result.email") || "" : "";
    const initial = propsEmail || fromSS || "";
    setEmail(initial);
    try { sessionStorage.setItem("result.email", initial); } catch {}
    setDebug((d) => d + `初期email:${initial}\n`);
  }, [propsEmail]);

  /* ---------------- session_id / sessionId から復元 ---------------- */
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

  /* ---------------- AIプラン取得 ---------------- */
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

        // ← JSON断定はしない（サーバーが壊れた応答でも安全に）
        const raw = await res.text();
        let json = null; try { json = JSON.parse(raw); } catch {}
        if (res.ok && json?.ok) {
          setDebug((d) => d + "AIプラン取得成功\n");
          setPlan(Array.isArray(json.plan) ? json.plan : []);
        } else {
          throw new Error(json?.error || raw || "AIプラン取得に失敗しました");
        }
      } catch (e) {
        setError(String(e));
        setDebug((d) => d + `AIプランエラー:${e}\n`);
      } finally {
        setLoading(false);
      }
    }
    fetchPlan();
  }, []);

  /* ---------------- メール送信 ---------------- */
  const sendPdf = async () => {
    setError("");
    setSentOK(false);
    setSending(true);
    setDebug((d) => d + "PDF送信開始\n");

    try {
      const to = (email || "").trim();

      // ざっくりバリデーション
      const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to);
      if (!valid) throw new Error("メールアドレスを正しく入力してください");

      // planが空でもAPI側でデフォルトが入るが、一応バックアップ
      const safePlan = (plan && plan.length > 0) ? plan : [
        "月: 納豆ご飯 + 味噌汁 / 30分ウォーキング",
        "火: 鶏むね肉の照り焼き / 20分ストレッチ",
        "水: 野菜たっぷりカレー / 休息",
        "木: さば味噌 / 30分ウォーキング",
        "金: 豚しゃぶサラダ / 20分筋トレ",
        "土: パスタ + サラダ / 軽い散歩",
        "日: 好きなもの少量 / 休息",
      ];

      const res = await fetch("/api/pdf-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          email: to,
          title: "AIヘルス週次プラン",
          plan: safePlan,
        }),
      });

      // ★ まずtextで受け、パースを試す（空レス耐性）
      const raw = await res.text();
      let json = null; try { json = JSON.parse(raw); } catch {}

      if (!res.ok || !json?.ok) {
        const msg = json?.error || raw || `HTTP ${res.status}`;
        throw new Error(msg);
      }

      setSentOK(true);
      setDebug((d) => d + `PDF送信成功 id:${json?.id ?? "n/a"}\n`);
    } catch (e) {
      setError(String(e));
      setDebug((d) => d + "PDF送信エラー:" + String(e) + "\n");
    } finally {
      setSending(false);
    }
  };

  /* ---------------- 入力 ---------------- */
  const onChange = (e) => {
    const v = (e.target.value || "").trim();
    setEmail(v);
    try { sessionStorage.setItem("result.email", v); } catch {}
  };

  /* ---------------- JSX ---------------- */
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
        <button
          className="btn primary"
          type="button"
          onClick={sendPdf}
          disabled={sending}
          aria-busy={sending ? "true" : "false"}
        >
          {sending ? "送信中..." : "PDFをメール送信"}
        </button>
      </div>

      {error && <div className="alert">エラー: {error}</div>}
      {sentOK && !error && <div className="alert" style={{ background: "#ecfdf5", color: "#065f46", borderLeftColor: "#34d399" }}>
        送信しました。メールをご確認ください。
      </div>}

      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">AIヘルス週次プラン</h2>
        {loading && <p>AIがプランを生成中です...</p>}
        {!loading && !error && plan.length > 0 && (
          <ul className="list-disc ml-6 text-sm">
            {plan.map((line, i) => <li key={i}>{line}</li>)}
          </ul>
        )}
      </div>

      {/* デバッグ */}
      <pre className="text-xs bg-gray-100 p-2 whitespace-pre-wrap">{debug}</pre>
    </div>
  );
}
