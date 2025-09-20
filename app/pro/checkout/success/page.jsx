// app/pro/checkout/success/page.jsx
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { Suspense } from "react";
import CheckoutSuccessClient from "./CheckoutSuccessClient";

export default function Page() {
  return (
    <Suspense fallback={<main className="p-6">決済を確認中です…</main>}>
      <CheckoutSuccessClient />
    </Suspense>
  );
}
