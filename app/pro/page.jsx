// app/pro/page.jsx
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import ProClient from "./ProClient";

export default function Page() {
  return <ProClient />;
}
