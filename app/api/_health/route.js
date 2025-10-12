// app/api/_health/route.js
export const runtime = "nodejs";
export async function GET(req) {
  const url = new URL(req.url);
  return new Response(
    JSON.stringify(
      {
        ok: true,
        path: url.pathname,
        commit: (process.env.VERCEL_GIT_COMMIT_SHA || "").slice(0, 7) || "(local)",
        env: process.env.VERCEL_ENV || "(unknown)",
        now: new Date().toISOString(),
      },
      null,
      2
    ),
    { headers: { "content-type": "application/json", "cache-control": "no-store" } }
  );
}
