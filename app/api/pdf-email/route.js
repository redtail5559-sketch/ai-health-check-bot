// app/api/pdf-email/route.js
// PDFを生成してResendでメール送信（添付あり）
// - ランタイムは Node.js（React-PDF が必要なため）
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
// components/ReportDocument.jsx を相対パスでimport
import ReportDocument from "../../../components/ReportDocument";

/** 環境 or リクエストから絶対URLを解決 */
function resolveBaseUrl(req) {
  const env = process.env.NEXT_PUBLIC_BASE_URL;
  if (env) return env.replace(/\/$/, "");
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || "https";
  return `${proto}://${host}`;
}

/** 画像URLを dataURL(base64) に変換（PDFに安全に埋め込み） */
async function fetchAsDataURL(url) {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`fetch ${url} failed: ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  // 今回はPNG想定。必要ならcontentType判定を追加
  return `data:image/png;base64,${buf.toString("base64")}`;
}

export async function POST(req) {
  try {
    // ①受信
    const url = new URL(req.url);
    const toFromQuery = url.searchParams.get("to") || url.searchParams.get("email") || "";

    let bodyText = "";
    try { bodyText = await req.text(); } catch {}
    let body = {};
    try { body = bodyText ? JSON.parse(bodyText) : {}; } catch { body = {}; }

    const to = body?.to || body?.email || toFromQuery || "";
    const subject = body?.subject || "AI健康診断 週次プラン";
    const report = body?.report;           // ← { mon..sun: {...} } の想定

    const apiKey = process.env.RESEND_API_KEY;
    const from   = process.env.RESEND_FROM;

    if (!apiKey) return NextResponse.json({ error: "Server misconfig: RESEND_API_KEY is missing" }, { status: 500 });
    if (!from)   return NextResponse.json({ error: "Server misconfig: RESEND_FROM is missing" }, { status: 500 });
    if (!to) {
      return NextResponse.json(
        { error: "`to` is required", hint: "Send JSON { to, report } or query ?to=" },
        { status: 400 }
      );
    }
    if (!report || typeof report !== "object") {
      return NextResponse.json(
        { error: "`report` JSON is required to build PDF" },
        { status: 400 }
      );
    }

    // ② 画像を dataURL 化（/public/illustrations/ai-robot.png を使う）
    const baseUrl = resolveBaseUrl(req);
    const robotSrc = await fetchAsDataURL(`${baseUrl}/illustrations/ai-robot.png`);

    const pdfBuffer = await renderToBuffer(
    <ReportDocument
      report={report}
      robotSrc={robotSrc}
      fontBaseUrl={`${baseUrl}/fonts`} 
    />
 );

    // ④ Resend REST API で送信（添付）
    const payload = {
      from,
      to,
      subject,
      html:
        `<p>AI健康診断の週次プランをPDFで添付しました。` +
        `<br/>スマホの方は添付を保存してご覧ください。</p>`,
      attachments: [
        {
          filename: "weekly-plan.pdf",
          content: pdfBuffer.toString("base64"),
          contenttype: "application/pdf",   // Resend REST: content_type
          // （SDKなら contentType だが、RESTでは content_type 推奨）
        },
      ],
    };

    const sendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify(payload),
    });

    const sendData = await sendRes.json().catch(() => ({}));
    if (!sendRes.ok) {
      return NextResponse.json(
        { error: sendData?.message || "Resend error", details: sendData },
        { status: sendRes.status || 500 }
      );
    }

    return NextResponse.json({ ok: true, id: sendData?.id ?? null });
  } catch (e) {
    console.error("[pdf-email] エラー発生:", e?.stack || e?.message || e?.toString?.() || e);
    return NextResponse.json({ error: e.message || "Unknown error" }, { status: 500 });
  }
}
