// app/pro/checkout/success/page.jsx
// ✅ force rebuild: goal display update
export const dynamic = "force-dynamic";

import CheckoutSuccessClient from "./CheckoutSuccessClient";

export default function Page() {
  return (
    <main className="p-6">
      <CheckoutSuccessClient />
    </main>
  );
}