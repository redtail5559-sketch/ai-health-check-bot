export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { Resend } from "resend";
import { pdf } from "@react-pdf/renderer";
import ReportDocument from "@/components/ReportDocument"; // 既存のPDFコンポーネント

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const to = String(body?.to || "").trim();
    const report = body?.report || {};

    if (!to) {
      return NextResponse.json({ ok: false, error: "to is required" }, { status: 400 });
    }

    // ✅ PDF生成（Buffer）
    const fontBaseUrl =
      process.env.NEXT_PUBLIC_ASSETS_BASE_URL?.replace(/\/$/, "") + "/fonts" ||
      "https://ai-health-check-bot.vercel.app/fonts";

    const doc = ReportDocument({
      report,
      robotSrc: "https://ai-health-check-bot.vercel.app/illustrations/ai-robot.png",
      fontBaseUrl,
    });

    const pdfBuffer = await pdf(doc).toBuffer();

    // ✅ Resendで添付送信
    const from = "AI Health Bot <noreply@ai-digital-lab.com>"; // 認証済みドメインの送信元にする
    const subject = "AI健康診断Bot レポート（PDF添付）";
    const text = "レポートをPDFでお送りします。ファイルを開いてご確認ください。";

    const { error } = await resend.emails.send({
      from,
      to,
      subject,
      text,
      attachments: [
        {
          filename: "report.pdf",
          content: pdfBuffer.toString("base64"),
        },
      ],
    });

    if (error) {
      return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e?.message || "unknown error" }, { status: 500 });
  }
}
