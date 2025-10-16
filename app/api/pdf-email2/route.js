// app/api/pdf-email2/route.js   ← ここ（もしくは src/app/...）
export const runtime = "nodejs";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true, marker: "pdf-email2 alive v1" });
}

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  return NextResponse.json({
    ok: true,
    marker: "pdf-email2 post v1",
    got: body?.email || null,
  });
}
