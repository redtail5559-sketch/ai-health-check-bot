// app/pro/success/page.jsx
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { Suspense } from "react";
import SuccessClient from "./SuccessClient";

export default function Page() {
  return (
    <Suspense fallback={<main className="p-6">お支払い完了。結果ページに移動します…</main>}>
      <SuccessClient />
    </Suspense>
  );
}
