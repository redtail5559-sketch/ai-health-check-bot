// app/pro/result/page.jsx
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = "nodejs";

import Image from "next/image";
import Link from "next/link";
import ResultClient from "./ResultClient";
import { headers } from "next/headers";

function resolveBaseUrl() {
  const h = headers();
  const proto = h.get("x-forwarded-proto") || "http";
  const host = h.get("x-forwarded-host") || h.get("host");
  return `${proto}://${host}`;
}

async function getPlan(profile = {}) {
  const baseUrl = resolveBaseUrl();
  const res = await fetch(`${baseUrl}/api/ai-plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profile }),
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  return json?.plan || {};
}

export default async function Page({ searchParams }) {
  const email = searchParams?.email || "";
  const plan = await getPlan({});

  return (
    // ← 下部固定ナビと被らないように余白を確保
    <div className="pro-result mx-auto max-w-2xl px-4 py-6 pb-28">
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

      {/* 本文 */}
      <ResultClient report={plan} email={email} />

      {/* 画面下部の固定ナビ：重なり対策に pointer-events を調整 */}
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

      {/* ✅ Server ComponentでもOKな通常の<style>でページ限定の非表示を適用 */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            /* 結果ページ限定。意図しない重複見出しを非表示に */
            .pro-result h1.text-2xl.font-bold { display: none !important; }
          `,
        }}
      />
    </div>
  );
}
