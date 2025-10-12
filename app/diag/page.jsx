// app/diag/page.jsx
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export default function Page({ searchParams }) {
  const email = typeof searchParams?.email === "string" ? searchParams.email : "";
  return (
    <div style={{ padding: 24 }}>
      <h1>Diag Page (SSR)</h1>
      <p>email (SSR): <code>{email || "(empty)"}</code></p>
      <p>commit: <code>{(process.env.VERCEL_GIT_COMMIT_SHA || "").slice(0, 7) || "(local)"}</code></p>
      <p>env: <code>{process.env.VERCEL_ENV || "(unknown)"}</code></p>
    </div>
  );
}
