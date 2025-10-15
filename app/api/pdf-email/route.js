// app/api/pdf-email/route.js
import { NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";

// ---- 診断用：GET で現在の設定を返す ----
export async function GET(req) {
  const email = new URL(req.url).searchParams.get("email") || "";
  const hasKey = !!process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || "";
  return NextResponse.json({ ok: true, diag: { email, hasKey, from } });
}

// ---- 送信：POST { email } ----
export async function POST(req) {
  try {
    let body = {};
    try { body = await req.json(); } catch {}
    const email = (body?.email || "").trim();

    if (!email) {
      return NextResponse.json({ ok: false, error: "email is required" }, { status: 400 });
    }
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ ok: false, error: "RESEND_API_KEY not set" }, { status: 500 });
    }
    if (!process.env.RESEND_FROM) {
      return NextResponse.json({ ok: false, error: "RESEND_FROM not set" }, { status: 500 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    // まずは本文のみ（PDFは後で差し替えOK）
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM,       // 例: noreply@ai-digital-lab.com（Resendで認証済み）
      to: [email],
      subject: "AIヘルス週次プラン（テスト送信）",
      text:
`このメールは送信テストです。
決済は完了し、メール送信APIも動作しています。
本番ではここにPDFを添付して送ります。`,
    });

    if (error) {
      return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
    }
    return NextResponse.json({ ok: true, id: data?.id || null });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
