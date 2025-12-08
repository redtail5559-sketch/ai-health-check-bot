'use client';
import { useEffect, useState } from "react";

export default function ProFormClient() {
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null); // ✅ 通知ステート追加

  const [form, setForm] = useState({
    heightCm: "",
    weightKg: "",
    age: "",
    sex: "",
    activity: "",
    sleep: "",
    drink: "",
    smoke: "",
    diet: "",
    goal: "",
    email: "",
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("userEmail");
    if (saved) {
      setForm((s) => ({ ...s, email: saved }));
    }
  }, []);

  const onChange = (k) => (e) => {
    const v = e.target.value;
    setForm((s) => ({ ...s, [k]: v }));

    if (k === "email" && typeof window !== "undefined") {
      const trimmed = v.trim();
      if (trimmed) window.localStorage.setItem("userEmail", trimmed);
      else window.localStorage.removeItem("userEmail");
    }
  };

  const onEmailBlur = () => {
    if (typeof window === "undefined") return;
    const trimmed = (form.email || "").trim();
    if (trimmed) window.localStorage.setItem("userEmail", trimmed);
    else window.localStorage.removeItem("userEmail");
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setNotice(null);

      if (typeof window !== "undefined") {
        const trimmed = (form.email || "").trim();
        if (trimmed) {
          window.localStorage.setItem("userEmail", trimmed);
          try { sessionStorage.setItem("result.email", trimmed); } catch {}
        } else {
          window.localStorage.removeItem("userEmail");
          try { sessionStorage.removeItem("result.email"); } catch {}
        }
      }

      sessionStorage.setItem("proForm", JSON.stringify(form));

      const payload = {
        email: (form.email || "").trim(),
        priceId: "price_1S5g0tGyL0KVvqbu6kXMmheF",
      };

      const res = await fetch("/api/checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "failed to create checkout session");
      }

      const { url, sessionId, error } = await res.json().catch(() => ({}));
      if (error) throw new Error(error);

      if (url) {
        window.location.href = url;
      } else if (sessionId) {
        throw new Error("checkout URL not returned");
      } else {
        throw new Error("invalid checkout response");
      }
    } catch (err) {
      console.error(err);
      setNotice("決済画面を開けませんでした。詳細: " + (err.message || "unknown")); // ✅ alertを撤去して通知に変更
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">AI健康チェックBot（有料版）</h1>
      <p className="text-gray-600 mt-2">入力→決済→結果→PDFメールまで自動でお届け。</p>

      {/* ✅ 通知表示（alertの代替） */}
      {notice && (
        <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
          {notice}
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-6 grid gap-3">
        {/* フォーム内容はそのまま */}
        {/* ...（省略） */}
      </form>
    </main>
  );
}