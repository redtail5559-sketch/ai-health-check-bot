export const runtime = "nodejs";

import { Resend } from "resend";
import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  let payload;

  try {
    payload = req.body;
  } catch (e) {
    console.error("❌ JSONパースエラー:", e);
    return res.status(400).json({
      ok: false,
      error: "リクエストが不正です（JSONが空または壊れています）",
    });
  }

  const { email, bmi, overview, goals, weekPlan } = payload;

  try {
    const doc = new PDFDocument({ margin: 40 });
    const buffers = [];

    // ✅ 日本語フォント読み込み
    const fontPath = path.resolve("public/fonts/NotoSansJP-Regular.ttf");
    if (fs.existsSync(fontPath)) {
      doc.registerFont("jp", fontPath);
      doc.font("jp");
    } else {
      console.warn("⚠️ 日本語フォントが見つかりません。デフォルトフォントで生成します");
    }

    // ✅ ロゴ画像挿入
    const logoPath = path.resolve("public/illustrations/logo.png");
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, { fit: [120, 120], align: "center" });
      doc.moveDown();
    }

    const pdfBufferPromise = new Promise((resolve) => {
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
    });

    // ✅ 色味追加
    doc.fillColor("#4B0082").fontSize(18).text("AI診断結果", { align: "center" });
    doc.moveDown();

    doc.fillColor("black").fontSize(12);
    doc.text(`メール: ${email ?? "未入力"}`);
    doc.text(`BMI: ${bmi ?? "未入力"}`);
    doc.text(`概要: ${overview ?? "未入力"}`);
    doc.text(`目標: ${(goals?.length ? goals.join("、") : "未設定")}`);
    doc.moveDown();

    doc.fillColor("#4B0082").fontSize(14).text("週間プラン:");
    doc.moveDown();

    weekPlan?.forEach((day) => {
      doc.fillColor("#333").fontSize(12);
      doc.text(`${day?.day ?? "日付不明"}`);
      doc.text(`朝食: ${day?.meals?.breakfast ?? "なし"}`);
      doc.text(`昼食: ${day?.meals?.lunch ?? "なし"}`);
      doc.text(`夕食: ${day?.meals?.dinner ?? "なし"}`);
      doc.text(`間食: ${day?.meals?.snack ?? "なし"}`);
      doc.text(`運動: ${day?.workout?.name ?? "未設定"}（${day?.workout?.minutes ?? 0}分）`);
      doc.text(`Tips: ${day?.workout?.tips ?? "なし"}`);
      doc.moveDown();
    });

    doc.end();

    const pdfData = await pdfBufferPromise;

    console.log("✅ PDF生成完了、Resend送信開始");

    try {
      await resend.emails.send({
        from: "noreply@ai-digital.lab.com",
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

      console.log("✅ Resend送信成功");
    } catch (sendError) {
      console.error("❌ Resend送信失敗:", sendError);
      return res.status(502).json({
        ok: false,
        error: sendError?.message ?? "PDF送信に失敗しました（Resendエラー）",
      });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("❌ PDF生成エラー:", error);
    return res.status(500).json({
      ok: false,
      error: error?.message ?? "PDF生成中に不明なエラーが発生しました",
    });
  }
}