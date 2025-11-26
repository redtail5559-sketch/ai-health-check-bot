"use client";
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-purple-50">
      {/* Hero セクション */}
      {/* ...（省略：Hero, Features, Plans, Sample Reportセクションは前回と同じ）... */}

      {/* フッター */}
      <footer className="border-t mt-8">
        <div className="max-w-6xl mx-auto px-6 py-8 text-sm text-gray-600">
          <p className="text-xs text-gray-500">
            ※ 本サービスは一般的な健康アドバイスの提供であり、医療行為ではありません。
          </p>

          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/terms" className="hover:underline">
              利用規約
            </Link>
            <Link href="/privacy" className="hover:underline">
              プライバシーポリシー
            </Link>
            <Link href="/disclaimer" className="hover:underline">
              免責ページ
            </Link>
            {/* ✅ 特商法専用ページへの外部リンク */}
            <a
              href="https://www.ai-digital-lab.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              特定商取引法に基づく表記
            </a>
          </div>

          <p className="mt-4 text-xs text-gray-400">© 2025 AI健康診断Bot</p>
        </div>
      </footer>
    </main>
  );
}