// app/pro/result/page.jsx
"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function ProResultPage() {
  const sp = useSearchParams();

  // Stripe の success_url に session_id が付くケースと、独自で sessionId を付けたケースの両対応
  const urlSessionId = sp.get("session_id") || sp.get("sessionId") || "";

  // 状態管理
  const [plan, setPlan] = useState(null); // AIのJSON
  const [status, setStatus] = useState("generating"); // 'generating' | 'ready' | 'error' | 'sending' | 'sent'
  const [customerEmail, setCustomerEmail] = useState(""); // ← 追加：Stripeから取得した送信先表示用

  // （追加）決済セッションから顧客メールを取得して表示
  useEffect(() => {
    (async () => {
      const sid =
        urlSessionId ||
        sessionStorage.getItem("sessionId") ||
        sessionStorage.getItem("stripeSessionId") ||
        "";
      if (!sid) return;
      try {
        const r = await fetch("/api/checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: sid }),
        });
        const d = await r.json();
        if (r.ok && d.email) setCustomerEmail(d.email);
      } catch {
        // 表示は任意なので握りつぶす
      }
    })();
  }, [urlSessionId]);

  // 生成フロー
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setStatus("generating");

        // セッションIDは URL > sessionStorage の順で取得
        const sid =
          urlSessionId ||
          sessionStorage.getItem("sessionId") ||
          sessionStorage.getItem("stripeSessionId") ||
          "";

        // 入力値
        const inputs = JSON.parse(sessionStorage.getItem("paidInputs") || "{}");

        if (!sid) {
          // セッションIDが不明でもキャッシュがあれば復元
          const cachedPlan = sessionStorage.getItem("aiPlanJson");
          if (cachedPlan) {
            if (!cancelled) {
              setPlan(JSON.parse(cachedPlan));
              setStatus("ready");
            }
            return;
          }
          throw new Error("セッションIDが取得できませんでした。決済URLをご確認ください。");
        }

        // 既に plan を保存している場合の高速復元
        const cached = sessionStorage.getItem(`aiPlanJson:${sid}`);
        if (cached) {
          if (!cancelled) {
            setPlan(JSON.parse(cached));
            setStatus("ready");
          }
          return;
        }

        // サーバーにAI生成を依頼
        const res = await fetch("/api/ai-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: sid, inputs }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.plan) {
          throw new Error(data?.error || "AI生成に失敗しました");
        }

        // セッションにキャッシュ
        sessionStorage.setItem(`aiPlanJson:${sid}`, JSON.stringify(data.plan));
        sessionStorage.setItem("aiPlanJson", JSON.stringify(data.plan)); // 汎用キー

        if (!cancelled) {
          setPlan(data.plan);
          setStatus("ready");
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) setStatus("error");
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [urlSessionId]);

  // HTML（メール/後でPDF化する際の共通ソース）
  const html = useMemo(() => {
    if (!plan) return "";
    const rows = (plan.week || [])
      .map((d, i) => {
        const m = d.meals || {};
        const w = d.workout || {};
        return `
      <tr>
        <td>${d.day ?? `Day${i + 1}`}</td>
        <td>
          <div><strong>朝:</strong> ${m.breakfast ?? ""}</div>
          <div><strong>昼:</strong> ${m.lunch ?? ""}</div>
          <div><strong>夜:</strong> ${m.dinner ?? ""}</div>
          <div><strong>間食:</strong> ${m.snack ?? ""}</div>
        </td>
        <td>
          <div>${w.menu ?? ""}</div>
          <div>目安 ${w.durationMin ?? ""} 分</div>
          <div style="color:#666;font-size:12px">${w.notes ?? ""}</div>
        </td>
      </tr>`;
      })
      .join("");

    const notes = (plan.notes || []).map((n) => `<li>${n}</li>`).join("");

    return `<!DOCTYPE html>
<html lang="ja"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>AI健康診断 7日間プラン</title>
<style>
  body{font-family:system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial;line-height:1.6;color:#111;margin:0;padding:0;background:#fff}
  .wrap{max-width:900px;margin:24px auto;padding:16px;border:1px solid #eee;border-radius:12px}
  h1{font-size:22px;margin:0 0 8px}
  .sub{color:#555;margin-bottom:12px}
  table{width:100%;border-collapse:collapse;margin-top:8px}
  th,td{border:1px solid #ddd;padding:10px;vertical-align:top}
  th{background:#fafafa;text-align:left}
  .notes{margin-top:16px}
</style>
</head>
<body>
  <div class="wrap">
    <h1>AI健康診断 7日間プラン</h1>
    <div class="sub">${plan?.profile?.summary ?? ""}</div>

    <table role="table">
      <thead>
        <tr><th style="width:80px">日</th><th>食事プラン</th><th style="width:260px">運動プラン</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="notes">
      <h3>注意点・補足</h3>
      <ul>${notes}</ul>
    </div>
  </div>
</body></html>`;
  }, [plan]);

  // 有料ユーザーのみ送信：宛先はサーバー側でStripeから取得
  const sendPaidEmail = async () => {
    try {
      if (!plan) return;

      // URL または sessionStorage から sessionId を取得
      const urlSession =
        new URLSearchParams(window.location.search).get("session_id") ||
        new URLSearchParams(window.location.search).get("sessionId");
      const sid = urlSession || sessionStorage.getItem("sessionId");
      if (!sid) {
        alert(
          "決済セッションIDが見つかりません。success_url に ?session_id={CHECKOUT_SESSION_ID} を設定してください。"
        );
        return;
      }

      setStatus("sending");
      const res = await fetch("/api/pdf-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sid, html }), // 宛先は送らない（サーバーでStripeから取得）
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setStatus("sent");
    } catch (e) {
      console.error(e);
      setStatus("error");
    }
  };

  // 画面
  return (
    <main className="max-w-5xl mx-auto p-6">
      <div className="rounded-2xl border p-6 shadow-sm bg-white">
        <div className="flex items-center gap-4 mb-2">
          <img src="/illustrations/ai-robot.png" alt="AI" className="w-16 h-16" />
          <div>
            <h1 className="text-2xl font-bold">AI健康診断 7日間プラン</h1>
            {!!plan?.profile?.summary && (
              <p className="text-gray-600">{plan.profile.summary}</p>
            )}
            {customerEmail && (
              <p className="text-sm text-gray-600">送信先：{customerEmail}</p>
            )}
          </div>
        </div>

        {status === "generating" && (
          <p className="text-gray-600">ただいまAIが作成中です…</p>
        )}

        {status !== "generating" && plan && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border px-3 py-2 w-20 text-left">日</th>
                  <th className="border px-3 py-2 text-left">食事プラン</th>
                  <th className="border px-3 py-2 w-72 text-left">運動プラン</th>
                </tr>
              </thead>
              <tbody>
                {(plan.week || []).map((d, idx) => (
                  <tr key={idx}>
                    <td className="border px-3 py-2">{d.day ?? `Day${idx + 1}`}</td>
                    <td className="border px-3 py-2">
                      <div><b>朝:</b> {d.meals?.breakfast}</div>
                      <div><b>昼:</b> {d.meals?.lunch}</div>
                      <div><b>夜:</b> {d.meals?.dinner}</div>
                      <div><b>間食:</b> {d.meals?.snack}</div>
                    </td>
                    <td className="border px-3 py-2">
                      <div>{d.workout?.menu}</div>
                      <div className="text-sm text-gray-600">目安 {d.workout?.durationMin} 分</div>
                      {d.workout?.notes && (
                        <div className="text-sm text-gray-500">{d.workout?.notes}</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {plan?.notes?.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold mb-1">注意点・補足</h3>
                <ul className="list-disc pl-5">
                  {plan.notes.map((n, i) => <li key={i}>{n}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}

        {status === "error" && (
          <p className="mt-4 text-red-600">
            エラーが発生しました。ブラウザのコンソールとサーバーログをご確認ください。
          </p>
        )}

        <div className="mt-6 space-y-2">
          <button
            onClick={sendPaidEmail}
            disabled={status === "sending" || status === "generating" || !plan}
            className="px-6 py-3 bg-pink-500 text-white rounded-full shadow hover:bg-pink-600 disabled:opacity-50"
          >
            {status === "sending" ? "送信中…" : "PDFでメール送信（有料購入者のみ）"}
          </button>

          {status === "sent" && <p className="font-semibold">✅ 送信しました。</p>}
        </div>
      </div>
    </main>
  );
}
