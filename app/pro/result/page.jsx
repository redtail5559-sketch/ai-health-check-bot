// app/pro/result/page.jsx
import Image from "next/image";
import Link from "next/link";
import ResultClient from "./ResultClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export default function Page({ searchParams }) {
  const emailParam =
    typeof searchParams?.email === "string" ? searchParams.email.trim() : "";

  // SSRデバッグ（必ず出る帯）
  const debugBanner = (
    <div
      style={{
        position: "fixed",
        insetInline: 0,
        top: 0,
        zIndex: 9999,
        background: "#e0f2fe",
        color: "#0369a1",
        fontSize: 12,
        padding: "6px 10px",
        borderBottom: "1px solid #bae6fd",
      }}
    >
      <strong>SSR DEBUG</strong>{" "}
      <span>emailParam={emailParam || "(empty)"} </span>{" "}
      <span> | commit={(process.env.VERCEL_GIT_COMMIT_SHA || "").slice(0,7) || "(local)"} </span>{" "}
      <span> | route=/pro/result </span>
      <style
        // 8秒で自動非表示
        dangerouslySetInnerHTML={{
          __html:
            "@keyframes fadeOut{to{opacity:0;visibility:hidden}} div[style*='fixed']{animation:fadeOut 1s ease 7s forwards}",
        }}
      />
    </div>
  );

  return (
    <div className="pro-result mx-auto max-w-2xl px-4 py-6 pb-28">
      {debugBanner}

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
          <p className="text-sm text-gray-500">食事とワークアウトの7日メニュー</p>
        </div>
      </div>

      {/* ここで props として確実に渡す */}
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

      {/* 見出し非表示（既存仕様） */}
      <style
        dangerouslySetInnerHTML={{
          __html: `.pro-result h1.text-2xl.font-bold { display:none !important; }`,
        }}
      />
    </div>
  );
}
