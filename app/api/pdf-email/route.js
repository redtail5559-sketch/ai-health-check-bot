// app/api/pdf-email/route.js
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "node:fs";
import path from "node:path";

/** 日本語フォント（任意） */
function loadJPFonts() {
  const pub = path.join(process.cwd(), "public", "fonts");
  const reg = path.join(pub, "NotoSansJP-Regular.ttf");
  const bold = path.join(pub, "NotoSansJP-Bold.ttf");
  const out = { regular: null, bold: null, hasJP: false };
  try {
    if (fs.existsSync(reg)) out.regular = fs.readFileSync(reg);
    if (fs.existsSync(bold)) out.bold = fs.readFileSync(bold);
    out.hasJP = !!out.regular;
  } catch {}
  return out;
}

function wrapTextByWidth(text, maxWidth, measure) {
  const lines = [];
  let cur = "";
  for (const ch of String(text)) {
    const test = cur + ch;
    if (measure(test) <= maxWidth || !cur) cur = test;
    else { lines.push(cur); cur = ch; }
  }
  if (cur) lines.push(cur);
  return lines;
}

async function buildPdf({ report, profile }) {
  let page = null;
  const doc = await PDFDocument.create();
  page = doc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();

  const fonts = loadJPFonts();
  const fontRegular = fonts.hasJP
    ? await doc.embedFont(fonts.regular)
    : await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = fonts.bold
    ? await doc.embedFont(fonts.bold)
    : await doc.embedFont(StandardFonts.HelveticaBold);

  const measure = (s, size) => fontRegular.widthOfTextAtSize(String(s), size);

  const margin = 40;
  let x = margin;
  let y = height - margin;
  const titleSize = 18;
  const subSize = 10;
  const dayTitle = 12;
  const body = 10;
  const gap = 14;

  page.drawText("AIヘルス週次プラン", { x, y, size: titleSize, font: fontBold });
  y -= gap * 1.4;
  page.drawText("食事とワークアウトの7日メニュー（自動生成）", {
    x, y, size: subSize, font: fontRegular, color: rgb(0.35, 0.35, 0.35),
  });
  y -= gap * 1.4;

  if (profile) {
    const txt = "プロフィール: " + JSON.stringify(profile).replace(/\s+/g, " ");
    const maxW = width - margin * 2;
    for (const ln of wrapTextByWidth(txt, maxW, (s) => measure(s, body)).slice(0, 3)) {
      page.drawText(ln, { x, y, size: body, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });
      y -= gap;
    }
    y -= 6;
  }

  const JP = { mon:"月", tue:"火", wed:"水", thu:"木", fri:"金", sat:"土", sun:"日" };
  const order = ["mon","tue","wed","thu","fri","sat","sun"];
  const labels = [["朝食","breakfast"],["昼食","lunch"],["夕食","dinner"],["運動","workout"],["Tips","tips"]];
  const maxW = width - margin * 2;

  for (const key of order) {
    const day = report?.[key] || {};
    page.drawText(`${JP[key]}曜日`, { x, y, size: dayTitle, font: fontBold }); y -= gap;

    for (const [label, field] of labels) {
      const raw = String(day[field] || "");
      const head = `${label}：`;
      const headW = measure(head, body);
      page.drawText(head, { x, y, size: body, font: fontBold });

      const lines = wrapTextByWidth(raw, maxW - headW, (s) => measure(s, body));
      if (lines.length) {
        page.drawText(lines[0], { x: x + headW, y, size: body, font: fontRegular }); y -= gap;
        for (const ln of lines.slice(1)) { page.drawText(ln, { x, y, size: body, font: fontRegular }); y -= gap; }
      } else { y -= gap; }
    }

    y -= 6;
    if (y < margin + 120) {
      page = doc.addPage([595.28, 841.89]);
      ({ width, height } = page.getSize());
      x = margin; y = height - margin;
      page.drawText("AIヘルス週次プラン（続き）", { x, y, size: dayTitle, font: fontBold }); y -= gap * 1.2;
    }
  }

  return await doc.save();
}

function toBase64(uint8) { return Buffer.from(uint8).toString("base64"); }

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { to, subject = "AI健康診断レポート", report, profile, html, text } = body || {};

    if (!process.env.RESEND_API_KEY)
      return NextResponse.json({ ok:false, error:"RESEND_API_KEY is not set" }, { status:500 });

    if (!report || typeof report !== "object")
      return NextResponse.json({ ok:false, error:"report is required (7-day plan object)" }, { status:400 });

    const pdf = await buildPdf({ report, profile });
    const payload = {
      from: "AIデジタルラボ <info@ai-digital-lab.com>",
      to: [to || "info@ai-digital-lab.com"],
      subject,
      html: html || `<p>AI健康診断レポートをお送りします。添付PDFをご確認ください。</p>`,
      text: text || "AI健康診断レポートをお送りします。添付PDFをご確認ください。",
      attachments: [{ filename: "AI_Health_Weekly_Plan.pdf", content: toBase64(pdf), contentType: "application/pdf" }],
    };

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.message || `Resend error: ${res.status}`);

    return NextResponse.json({ ok: true, id: data?.id || null }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ ok:false, error: e?.message || "Unknown error" }, { status:400 });
  }
}
