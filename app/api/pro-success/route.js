// app/pro/success/route.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

export async function GET(req) {
  const url = new URL(req.url);
  const sid = url.searchParams.get("sid") || url.searchParams.get("session_id") || "";
  const to = new URL(url.origin + "/pro/result");
  if (sid) to.searchParams.set("sessionId", sid);
  return NextResponse.redirect(to, 302);
}
