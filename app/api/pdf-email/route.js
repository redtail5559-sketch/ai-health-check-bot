// app/api/pdf-email/route.js
export const runtime = "edge";
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const url = new URL(req.url);
    // まずはクエリ ?to= でも受け取る
    let toFromQuery = url.searchParams.get("to") || url.searchParams.get("email") || "";

    // 本文は壊れていてもなるべく読む
    let bodyText = "";
    try { bodyText = await req.text(); } catch {}
    let body = {};
    try { body = bodyText ? JSON.parse(bodyText) : {}; } catch { body = {}; }

    const to = body?.to || body?.email || toFromQuery || "";
    const subject = body?.subject;
    const html = body?.html;
    const report = body?.report;

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM;

    // デバッグログ（Vercel Functions Logs に出ます）
    console.log("[pdf-email]",
      JSON.stringify({
        from, to, hasHtml: !!html, hasReport: !!report,
        receivedKeys: Object.keys(body || {}),
        queryTo: toFromQuery,
        bodyLen: (bodyText || "").length,
        ct: req.headers.get("content-type") || ""
      })
    );

    if (!apiKey) return NextResponse.json({ error: "Server misconfig: RESEND_API_KEY is missing" }, { status: 500 });
    if (!from)  return NextResponse.json({ error: "Server misconfig: RESEND_FROM is missing" }, { status: 500 });
    if (!to) {
      return NextResponse.json(
        {
          error: "`to` is required",
          hint: "Send either JSON { to } or query ?to=",
          receivedKeys: Object.keys(body || {}),
          queryTo: toFromQuery
        },
        { status: 400 }
      );
    }

    const payload = {
      from,
      to,
      subject: subject || "Your AI Health Report",
      ...(html ? { html } : { text: typeof report === "string" ? report : JSON.stringify(report ?? {}, null, 2) }),
    };

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data?.message || "Resend error", details: data }, { status: res.status || 500 });
    }

    return NextResponse.json({ ok: true, id: data?.id ?? null });
  } catch (e) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}
