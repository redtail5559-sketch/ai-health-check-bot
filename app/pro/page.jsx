// app/pro/page.jsx
"use client";

import ProFormClient from "./ProFormClient";

export default function ProPage() {
  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">有料診断フォーム</h1>
      <ProFormClient />
    </main>
  );
}
