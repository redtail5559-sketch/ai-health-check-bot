// app/api/pdf-email/route.js
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const { sessionId, email, report } = await req.json();
    if (!sessionId || !email || !report) {
      return NextResponse.json({ ok: false, error: "missing fields" }, { status: 400 });
    }

    // PDF 生成処理（仮）
    const pdfBuffer = Buffer.from(`診断レポート\n\n${JSON.stringify(report, null, 2)}`);

    await resend.emails.send({
      from: process.env.MAIL_FROM,
      to: email,
      subject: "AI健康診断レポート",
      text: "診断結果をPDFでお送りします。",
      attachments: [
        {
          filename: "report.pdf",
          content: pdfBuffer.toString("base64"),
          type: "application/pdf",
          disposition: "attachment",
        },
      ],
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("pdf-email error", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
