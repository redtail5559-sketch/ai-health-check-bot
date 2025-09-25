// app/api/pdf-email/route.js
export const runtime = "edge";
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

const isEmail = (s) => typeof s === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s || "");

export async function POST(req) {
  try {
    const url = new URL(req.url);

    // クエリ or ボディを読む（壊れていても読めるだけ読む）
    const toFromQueryRaw = url.searchParams.get("to") || url.searchParams.get("email") || "";
    let bodyText = "";
    try { bodyText = await req.text(); } catch {}
    let body = {};
    try { body = bodyText ? JSON.parse(bodyText) : {}; } catch { body = {}; }

    // ★ここ重要：全部 trim する
    const to   = String(body?.to || body?.email || toFromQueryRaw || "").trim();
    const subj = String(body?.subject || "Your AI Health Report").trim();
    const html = body?.html;
    const report = body?.report;

    // ★ここ重要：環境変数も trim
    const apiKey = (process.env.RESEND_API_KEY || "").trim();
    const from   = (process.env.RESEND_FROM   || "").trim();

    // デバッグログ（Vercel Functions Logs）
    console.log("[pdf-email]", JSON.stringify({
      from, to, hasHtml: !!html, hasReport: !!report,
      receivedKeys: Object.keys(body || {}),
      queryTo: toFromQueryRaw,
      bodyLen: (bodyText || "").length,
      ct: req.headers.get("content-type") || ""
    }));

    if (!apiKey) return NextResponse.json({ error: "Server misconfig: RESEND_API_KEY is missing" }, { status: 500 });
    if (!from)  return NextResponse.json({ error: "Server misconfig: RESEND_FROM is missing" }, { status: 500 });
    if (!to) {
      return NextResponse.json(
        { error: "`to` is required", hint: "Send JSON { to } or query ?to=", receivedKeys: Object.keys(body || {}), queryTo: toFromQueryRaw },
        { status: 400 }
      );
    }

    // 形式チェック（Resendは厳格）
    if (!isEmail(to)) {
      return NextResponse.json({ error: "Invalid `to` email address format", to }, { status: 422 });
    }
    // from は `noreply@domain` か `Name <noreply@domain>` のどちらか
    const fromOk = isEmail(from) || /^.+\s<[^>]+>$/.test(from);
    if (!fromOk) {
      return NextResponse.json({ error: "Invalid `from` format. Use `name <email@domain>` or `email@domain`.", from }, { status: 422 });
    }

    const payload = {
      from,
      to,
      subject: subj,
      ...(html
        ? { html }
        : { text: typeof report === "string" ? report : JSON.stringify(report ?? {}, null, 2) }),
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
