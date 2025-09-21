// app/api/pdf-email/route.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { Resend } from "resend";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const resend = new Resend(process.env.RESEND_API_KEY);

async function buildPdfBuffer(report) {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([595.28, 841.89]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontB = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const draw = (t, x, y, size = 12, bold = false) =>
    page.drawText(t, { x, y, size, font: bold ? fontB : font, color: rgb(0.15, 0.15, 0.15) });

  let y = 800;
  draw("AI 健康診断レポート", 50, y, 20, true); y -= 30;
  draw(`作成日時: ${new Date().toLocaleString("ja-JP")}`, 50, y); y -= 20;

  y -= 10; draw("■ プロフィール", 50, y, 14, true); y -= 18;
  const p = report.profile || {};
  [
    `身長: ${p.heightCm} cm  /  体重: ${p.weightKg} kg  /  BMI: ${report.bmi ?? "-"}`,
    `年齢: ${p.age}  /  性別: ${p.sex}`,
    `運動量: ${p.activity}  /  睡眠: ${p.sleep}`,
    `飲酒: ${p.drink}  /  喫煙: ${p.smoke}`,
    `食事傾向: ${p.diet}`,
  ].forEach(t => { draw(t, 60, y); y -= 16; });

  y -= 8; draw("■ 総括", 50, y, 14, true); y -= 18;
  draw(report.overview || "", 60, y); y -= 28;

  y -= 8; draw("■ 今週の目標", 50, y, 14, true); y -= 18;
  (report.goals || []).forEach(g => { draw(`・${g}`, 60, y); y -= 16; });

  y -= 8; draw("■ 1週間の食事・運動プラン", 50, y, 14, true); y -= 18;
  (report.weekPlan || []).forEach(d => {
    draw(`【${d.day}】`, 60, y, 12, true); y -= 16;
    draw(`朝: ${d.meals?.breakfast}`, 72, y); y -= 14;
    draw(`昼: ${d.meals?.lunch}`, 72, y); y -= 14;
    draw(`夜: ${d.meals?.dinner}`, 72, y); y -= 14;
    draw(`間食: ${d.meals?.snack}`, 72, y); y -= 14;
    draw(`運動: ${d.workout?.name} ${d.workout?.minutes}分（${d.workout?.intensity}）`, 72, y); y -= 14;
    draw(`Tips: ${d.workout?.tips}`, 72, y); y -= 18;
    if (y < 120) { page = pdfDoc.addPage([595.28, 841.89]); y = 800; }
  });

  return Buffer.from(await pdfDoc.save());
}

export async function POST(req) {
  try {
    const body = await req.json();
    const report = typeof body.report === "string" ? JSON.parse(body.report) : body.report;
    const to = report?.email || body?.to;
    if (!to) return NextResponse.json({ ok: false, error: "missing recipient email" }, { status: 400 });

    const pdfBuffer = await buildPdfBuffer(report);
    const from = process.env.MAIL_FROM; // 例: no-reply@yourdomain.com

    if (!process.env.RESEND_API_KEY || !from) {
      throw new Error("RESEND_API_KEY/MAIL_FROM is not set");
    }

    const { error } = await resend.emails.send({
      from,
      to,
      subject: "AI健康診断レポート（PDF添付）",
      text: "AI健康診断レポートをお送りします。PDFを添付しています。",
      attachments: [{
        filename: "health-report.pdf",
        content: pdfBuffer.toString("base64"),
        contentType: "application/pdf",
      }],
    });

    if (error) throw error;
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error("[pdf-email] error:", e);
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}

onClick={async () => {
  try {
    const r = await fetch("/api/pdf-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ report: state.data }),
    });
    const j = await r.json();
    if (!r.ok || !j.ok) throw new Error(j.error || "メール送信に失敗しました");
    alert("PDFをメール送信しました！");
  } catch (e) {
    alert(`送信エラー: ${e.message}`);
  }
}}

