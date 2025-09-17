// app/pro/page.jsx
"use client";

export default function ProPage() {
  // メールを入力してCheckout開始
  const startCheckout = async () => {
    const email = document.getElementById("email").value;
    if (!email) {
      alert("メールアドレスを入力してください");
      return;
    }

    // 入力メールを sessionStorage に保存（後で result ページでも使える）
    sessionStorage.setItem("buyerEmail", email);

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }), // ← 入力メールを送信
    });

    const data = await res.json();
    if (data.url) {
      window.location.href = data.url; // Stripe Checkoutへ遷移
    } else {
      alert("Checkout作成失敗: " + (data.error || "unknown"));
    }
  };

  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">AI健康診断（有料版）</h1>
      <p className="mb-2">メールアドレスを入力してお進みください。</p>
      <input
        id="email"
        type="email"
        placeholder="you@example.com"
        className="border rounded px-3 py-2 w-full mb-4"
      />
      <button
        onClick={startCheckout}
        className="px-6 py-3 bg-pink-500 text-white rounded-full shadow hover:bg-pink-600"
      >
        有料プランに進む
      </button>
    </main>
  );
}
