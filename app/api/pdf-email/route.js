import { NextResponse } from "next/server";
import { Resend } from "resend";
import PDFDocument from "pdfkit";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: Request) {
  const { email, bmi, overview, goals, weekPlan } = await req.json();

  const doc = new PDFDocument();
  const buffers: Buffer[] = [];

  // PDF生成完了を待つ Promise を作成
  const pdfBufferPromise = new Promise<Buffer>((resolve) => {
    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });
  });

  // PDF内容を書く
  doc.fontSize(16).text("AI診断結果", { align: "center" });
  doc.moveDown();
  doc.text(`メール: ${email}`);
  doc.text(`BMI: ${bmi}`);
  doc.text(`概要: ${overview}`);
  doc.text(`目標: ${goals.join("、")}`);
  doc.moveDown();

  doc.text("週間プラン:");
  weekPlan.forEach((day) => {
    doc.moveDown();
    doc.text(`${day.day}`);
    doc.text(`朝食: ${day.meals?.breakfast}`);
    doc.text(`昼食: ${day.meals?.lunch}`);
    doc.text(`夕食: ${day.meals?.dinner}`);
    doc.text(`間食: ${day.meals?.snack}`);
    doc.text(`運動: ${day.workout?.name}（${day.workout?.minutes}分）`);
    doc.text(`Tips: ${day.workout?.tips}`);
  });

  doc.end();

  // PDF生成完了を待つ
  const pdfData = await pdfBufferPromise;

  // メール送信
  await resend.emails.send({
    from: process.env.FROM_EMAIL!,
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
}