"use client";
import { useEffect, useState } from "react";

export default function ResultClient({ email: propsEmail = "" }) {
  const [email, setEmail] = useState("");
  const [debug, setDebug] = useState("");

  const [plan, setPlan] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [sending, setSending] = useState(false);
  const [sentOK, setSentOK] = useState(false);

  useEffect(() => {
    const fromSS = typeof window !== "undefined" ? sessionStorage.getItem("result.email") || "" : "";
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
        const res = await fetch(`/api/pro-result?sessionId=${encodeURIComponent(sid)}`, { cache: "no-store" });
        const raw = await res.text();
        setDebug((d) => d + `API応答:${raw}\n`);
        let json = null; try { json = JSON.parse(raw); } catch {}
        if (res.ok && json?.ok && Array.isArray(json.data?.weekPlan)) {
          setPlan(json.data.weekPlan);
          setEmail(json.data.email || "");
          try { sessionStorage.setItem("result.email", json.data.email || ""); } catch {}
          setDebug((d) => d + "週次プラン取得成功\n");
        } else {
          throw new Error(json?.error || "週次プラン取得に失敗しました");
        }
      } catch (e) {
        setError(String(e));
        setDebug((d) => d + `APIエラー:${e}\n`);
      }
    })();
  }, [email]);

  const sendPdf = async () => {
    setError("");
    setSentOK(false);
    setSending(true);
    setDebug((d) => d + "PDF送信開始\n");

    try {
      const to = (email || "").trim();
      const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to);
      if (!valid) throw new Error("メールアドレスを正しく入力してください");

      const res = await fetch("/api/pdf-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          email: to,
          title: "AIヘルス週次プラン",
          plan,
        }),
      });

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

  const onChange = (e) => {
    const v = (e.target.value || "").trim();
    setEmail(v);
    try { sessionStorage.setItem("result.email", v); } catch {}
  };

  return (
    <div className="pro-result">
      <div className="header">
        <img src="/icon.png" alt="" width={36} height={36} onError={(e)=>{ e.currentTarget.style.display='none'; }} />
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
        <h2 className="text-lg font-semibold mb-2">週次プラン（表形式）</h2>
        {loading && <p>AIがプランを生成中です...</p>}
        {!loading && !error && plan.length > 0 && (
          <table className="table-auto text-sm border-collapse border border-gray-300">
            <thead>
              <tr>
                <th className="border px-2 py-1">曜日</th>
                <th className="border px-2 py-1">朝食</th>
                <th className="border px-2 py-1">昼食</th>
                <th className="border px-2 py-1">夕食</th>
                <th className="border px-2 py-1">間食</th>
                <th className="border px-2 py-1">運動</th>
                <th className="border px-2 py-1">Tips</th>
              </tr>
            </thead>
            <tbody>
              {plan.map((d, i) => (
                <tr key={i}>
                  <td className="border px-2 py-1">{d.day}</td>
                  <td className="border px-2 py-1">{d.meals?.breakfast}</td>
                  <td className="border px-2 py-1">{d.meals?.lunch}</td>
                  <td className="border px-2 py-1">{d.meals?.dinner}</td>
                  <td className="border px-2 py-1">{d.meals?.snack}</td>
                  <td className="border px-2 py-1">{d.workout?.name}（{d.workout?.minutes}分）</td>
                  <td className="border px-2 py-1">{d.workout?.tips}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <pre className="text-xs bg-gray-100 p-2 whitespace-pre-wrap">{debug}</pre>
    </div>
  );
}