// app/pro/result/page.jsx
import Image from "next/image";
import Link from "next/link";
import ResultClient from "./ResultClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export default function Page({ searchParams }) {
  // SSRでemailを確実に受け取る
  const emailParam =
    typeof searchParams?.email === "string" ? searchParams.email.trim() : "";

  return (
    <div className="pro-result mx-auto max-w-2xl px-4 py-6 pb-28">
      {/* SSRデバッグ帯 */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          background: "#e0f2fe",
          color: "#0369a1",
          fontSize: 12,
          padding: "6px 10px",
          borderBottom: "1px solid #bae6fd",
        }}
      >
        <strong>SSR DEBUG</strong>{" "}
        emailParam: <code>{emailParam || "(empty)"}</code>
      </div>

      {/* ヘッダー */}
      <div className="mb-4 flex items-center gap-3">
        <Image
          src="/illustrations/ai-robot.png"
          alt="AIロボ"
          width={48}
          height={48}
          priority
        />
        <div>
          <h1 className="text-xl font-semibold">AIヘルス週次プラン</h1>
          <p className="text-sm text-gray-500">
            食事とワークアウトの7日メニュー
          </p>
        </div>
      </div>

      {/* ✅ emailParamをpropsとして確実に渡す */}
      <ResultClient email={emailParam} />

      {/* 下部ナビ */}
      <div className="pointer-events-none fixed bottom-3 left-0 right-0 z-40 mx-auto flex w-full max-w-screen-sm justify-center">
        <div className="pointer-events-auto flex gap-3 rounded-xl border bg-white/90 px-4 py-2 shadow">
          <Link href="/" className="px-3 py-1.5 rounded-md hover:bg-gray-50">
            ← トップに戻る
          </Link>
          <Link href="/pro" className="px-3 py-1.5 rounded-md hover:bg-gray-50">
            もう一度
          </Link>
        </div>
      </div>
    </div>
  );
}
