// PDFメール最新版（JSON補強 + Resend送信ログ追加 + 全レスポンス保証）

export const runtime = "nodejs";

import Resend from "resend";
import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  let payload;

  // ✅ JSONパース失敗時の補強
  try {
    payload = await req.json();
  } catch (e) {
    console.error("❌ JSONパースエラー:", e);
    return NextResponse.json(
      { ok: false, error: "リクエストが不正です（JSONが空または壊れています）" },
      { status: 400 }
    );
  }

  const { email, bmi, overview, goals, weekPlan } = payload;

  try {
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

    console.log("✅ PDF生成完了、Resend送信開始");

    // ✅ Resend送信処理
    try {
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

      console.log("✅ Resend送信成功");
    } catch (sendError) {
      console.error("❌ Resend送信失敗:", sendError);
      return NextResponse.json(
        { ok: false, error: sendError?.message ?? "PDF送信に失敗しました（Resendエラー）" },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("❌ PDF生成エラー:", error);
    return NextResponse.json(
      { ok: false, error: error?.message ?? "PDF生成中に不明なエラーが発生しました" },
      { status: 500 }
    );
  }
}