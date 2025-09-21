// app/pro/success/route.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

export async function GET(req) {
  const url = new URL(req.url);
  // Stripe は success_url={CHECKOUT_SESSION_ID} を session_id として返す場合もある
  const sid = url.searchParams.get("sid") || url.searchParams.get("session_id") || "";

  // /pro/result?sessionId=... へ 302 リダイレクト
  const to = new URL(url.origin + "/pro/result");
  if (sid) to.searchParams.set("sessionId", sid);
  return NextResponse.redirect(to, 302);
}
