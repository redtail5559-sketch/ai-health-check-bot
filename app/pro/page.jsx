"use client";
export const dynamic = 'force-dynamic';
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function Success() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Stripe の success_url から ?session_id=... が渡ってくる想定
    const id = sp.get("session_id") || sp.get("sessionId");
    if (id) {
      // 後続ページで使えるように保存
      sessionStorage.setItem("sessionId", id);
      sessionStorage.setItem("stripeSessionId", id);
      // 結果ページへリダイレクト
      router.replace(`/pro/result?session_id=${id}`);
    } else {
      router.replace("/pro/result");
    }
  }, [router, sp]);

  return (
    <main className="p-6">
      決済が完了しました。レポートへ移動します…
    </main>
  );
}
