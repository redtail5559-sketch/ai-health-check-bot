// app/api/pdf-email/route.js
import { NextResponse } from "next/server";

export const runtime = "nodejs";
const RESEND_API_URL = "https://api.resend.com/emails";

// 診断（そのまま）
export async function GET(req) {
  const email = new URL(req.url).searchParams.get("email") || "";
  return NextResponse.json({
    ok: true,
    diag: {
      email,
      hasKey: !!process.env.RESEND_API_KEY,
      from: process.env.RESEND_FROM || "",
    },
  });
}

// 送信（REST直呼び出し）
export async function POST(req) {
  try {
    const { email } = await req.json().catch(() => ({}));
    const to = (email || "").trim();

    if (!to) return NextResponse.json({ ok: false, error: "email is required" }, { status: 400 });
    if (!process.env.RESEND_API_KEY) return NextResponse.json({ ok: false, error: "RESEND_API_KEY not set" }, { status: 500 });
    if (!process.env.RESEND_FROM) return NextResponse.json({ ok: false, error: "RESEND_FROM not set" }, { status: 500 });

    const r = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM,      // 例: "noreply@ai-digital-lab.com"
        to: [to],
        subject: "AIヘルス週次プラン（テスト送信）",
        text: `このメールは送信テストです。\n決済は完了し、メール送信APIも動作しています。`,
      }),
    });

    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      return NextResponse.json({ ok: false, status: r.status, error: data?.message || JSON.stringify(data) }, { status: 500 });
    }
    return NextResponse.json({ ok: true, id: data?.id || null });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
