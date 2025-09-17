// app/api/debug-pdf/route.js
export const runtime = "nodejs";

import { pdf } from "@react-pdf/renderer";
import React from "react";
// ← components はプロジェクト直下にあるので "../../../"
import ReportDocument from "../../../components/ReportDocument";

export async function GET() {
  const demo = "これはテストPDFです。\n日本語フォントの埋め込み確認。";
  const buffer = await pdf(<ReportDocument content={demo} />).toBuffer();

  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="test.pdf"',
    },
  });
}
