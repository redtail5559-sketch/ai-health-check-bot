// app/api/pdf-email/route.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { Resend } from "resend";
import { PDFDocument, StandardFonts } from "pdf-lib";

const resend = new Resend(process.env.RESEND_API_KEY);

async function buildPdfBuffer(report) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]); // A4
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontB = await pdf.embedFont(StandardFonts.HelveticaBold);

  let y = 800;
  const draw = (t, size = 12, bold = false) => {
    page.drawText(String(t ?? ""), { x: 50, y, size, font: bold ? fontB : font });
    y -= size + 6;
  };

  draw("AI健康診断レポート", 20, true);
  draw(`作成: ${new Date().toLocaleString("ja-JP")}`);
  draw("");
  draw("■ プロフィール", 14, true);
  const p = report?.profile ?? {};
  draw(`身長:${p.heightCm} 体重:${p.weightKg} BMI:${report?.bmi ?? "-"}`);
  draw(`年齢:${p.age} 性別:${p.sex}`);
  draw(`運動:${p.activity} 睡眠:${p.sleep}`);
  draw(`飲酒:${p.drink} 喫煙:${p.smoke}`);
  draw(`食事傾向:${p.diet}`);
  draw("");
  draw("■ 総括", 14, true);
  draw(report?.overview || "");
  draw("");
  draw("■ 今週の目標", 14, true);
  (report?.goals || []).forEach(g => draw(`・${g}`));
  draw("");
  draw("■ 1週間プラン", 14, true);
  (report?.weekPlan || []).forEach(d => {
    draw(`【${d.day}】`, 12, true);
    draw(`朝: ${d.meals?.breakfast}`);
    draw(`昼: ${d.meals?.lunch}`);
    draw(`夜: ${d.meals?.dinner}`);
    draw(`間: ${d.meals?.snack}`);
    draw(`運動: ${d.workout?.name} ${d.workout?.minutes}分（${d.workout?.intensity}）`);
    y -= 8;
  });

  const bytes = await pdf.save();
  return Buffer.from(bytes);
}

export async function POST(req) {
  try {
    const body = await req.json();
    const report = typeof body.report === "string" ? JSON.parse(body.report) : body.report;
    const to = body.email || report?.email;

    if (!to) return NextResponse.json({ ok: false, error: "missing recipient email" }, { status: 400 });
    if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM) {
      return NextResponse.json({ ok: false, error: "RESEND_API_KEY / RESEND_FROM not set" }, { status: 500 });
    }

    const pdfBuffer = await buildPdfBuffer(report);

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM, // 例: no-reply@your-domain

      to,
      subject: "AI健康診断レポート（PDF添付）",
      text: "診断レポートをPDFでお送りします。",
      attachments: [{
        filename: "health-report.pdf",
        content: pdfBuffer.toString("base64"),
        type: "application/pdf",
      }],
    });

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[pdf-email] error:", e);
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
