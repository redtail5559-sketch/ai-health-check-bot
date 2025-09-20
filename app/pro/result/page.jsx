// app/pro/result/page.jsx
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { Suspense } from "react";
import ResultClient from "./ResultClient";

export default function Page() {
  return (
    <Suspense fallback={<main className="p-6">レポートを読み込み中…</main>}>
      <ResultClient />
    </Suspense>
  );
}
