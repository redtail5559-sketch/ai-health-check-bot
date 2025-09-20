// app/pro/page.jsx
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import ProFormClient from "./ProFormClient";   // ← ここがポイント（ProClient ではなく ProFormClient）

export default function Page() {
  return <ProFormClient />;
}
