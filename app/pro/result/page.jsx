// app/pro/result/page.jsx
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = "nodejs";

import Image from "next/image";
import Link from "next/link";

import ResultClient from "./ResultClient";

export default async function Page({ searchParams }) {
  // ✅ 決済成功URLから付与されるクエリを受け取る（SSRでは取得しない）
  const email = searchParams?.email || "";
   return <ResultClient email={email} />;  // ← report は渡さない
}
  return (
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

      {/* ✅ report は渡さない → クライアント側で必ず取得＆乱数・キャッシュ無効が効く */}
      <ResultClient email={email} />

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

      <style
        dangerouslySetInnerHTML={{
          __html: `
            .pro-result h1.text-2xl.font-bold { display: none !important; }
          `,
        }}
      />
    </div>
  );
}
