// PDFメール最新版（NullError対策 + エラー詳細返却）

export const runtime = "nodejs";

import Resend from "resend";
import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const { email, bmi, overview, goals, weekPlan } = await req.json();

    const doc = new PDFDocument();
    const buffers = [];

    const pdfBufferPromise = new Promise((resolve) => {
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
    });

    doc.fontSize(16).text("AI診断結果", { align: "center" });
    doc.moveDown();
    doc.text(`メール: ${email ?? "未入力"}`);
    doc.text(`BMI: ${bmi ?? "未入力"}`);
    doc.text(`概要: ${overview ?? "未入力"}`);
    doc.text(`目標: ${(goals?.length ? goals.join("、") : "未設定")}`);
    doc.moveDown();

    doc.text("週間プラン:");
    weekPlan?.forEach((day) => {
      doc.moveDown();
      doc.text(`${day?.day ?? "日付不明"}`);
      doc.text(`朝食: ${day?.meals?.breakfast ?? "なし"}`);
      doc.text(`昼食: ${day?.meals?.lunch ?? "なし"}`);
      doc.text(`夕食: ${day?.meals?.dinner ?? "なし"}`);
      doc.text(`間食: ${day?.meals?.snack ?? "なし"}`);
      doc.text(`運動: ${day?.workout?.name ?? "未設定"}（${day?.workout?.minutes ?? 0}分）`);
      doc.text(`Tips: ${day?.workout?.tips ?? "なし"}`);
    });

    doc.end();

    const pdfData = await pdfBufferPromise;

    await resend.emails.send({
      from: "onboarding@resend.dev", // ← 一時的にこれに変更
      to: email,
      subject: "AI診断レポート",
      text: "診断結果PDFを添付します。",
      attachments: [
        {
          filename: "diagnosis.pdf",
          content: pdfData.toString("base64"),
        },
      ],
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PDF送信エラー:", error);
    return NextResponse.json(
      { ok: false, error: error?.message ?? "PDF送信中に不明なエラーが発生しました" },
      { status: 500 }
    );
  }
}