// app/pro/page.jsx
export const dynamic = "force-dynamic";   // ← プリレンダーを避ける保険（任意）
"use client";                              // ← ProClientがClientなら、ここに付けるのもOK

import ProFormClient from "./ProFormClient"; // 直接 ProFormClient を使う方が確実

export default function ProPage() {
  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">有料診断フォーム</h1>
      <ProFormClient />
    </main>
  );
}
