// app/api/pdf-email/route.js
export const runtime = "edge";
export const dynamic = "force-dynamic"; // 静的最適化を回避
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { to, subject, html, report } = await req.json();

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM;

    if (!apiKey) {
      return NextResponse.json({ error: "Server misconfig: RESEND_API_KEY is missing" }, { status: 500 });
    }
    if (!from) {
      return NextResponse.json({ error: "Server misconfig: RESEND_FROM is missing" }, { status: 500 });
    }
    if (!to) {
      return NextResponse.json({ error: "`to` is required" }, { status: 400 });
    }

    const payload = {
      from,
      to,
      subject: subject || "Your AI Health Report",
      ...(html
        ? { html } // HTMLが来たらそのまま送信
        : { text: typeof report === "string" ? report : JSON.stringify(report, null, 2) }),
    };

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data?.message || "Resend error", details: data },
        { status: res.status || 500 }
      );
    }

    return NextResponse.json({ ok: true, id: data?.id ?? null });
  } catch (e) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}
