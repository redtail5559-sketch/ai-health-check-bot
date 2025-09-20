// app/page.jsx
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="bg-gray-50 min-h-screen">
      {/* ヒーローセクション */}
      <section className="bg-gradient-to-r from-pink-100 via-purple-100 to-blue-100 py-16">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <span className="text-sm text-pink-600 font-semibold">無料で1分診断</span>
          <h1 className="text-4xl md:text-5xl font-extrabold mt-2">
            AI健康診断Bot 🎉<br />
            <span className="text-purple-600">入力するだけで</span> 今日の健康チェック
          </h1>
          <p className="mt-4 text-gray-600">
            身長・体重・生活習慣を入力すると、AIがBMIとワンポイントアドバイスを返します。<br />
            さらに有料版なら1週間の食事・運動プランをPDFでお届け。
          </p>

          <div className="mt-6 flex justify-center gap-4">
            <Link
              href="/free"
              className="bg-pink-500 hover:bg-pink-600 text-white rounded-lg px-6 py-3 font-semibold"
            >
              無料で診断してみる →
            </Link>
            <Link
              href="/pro"
              className="bg-black hover:bg-gray-800 text-white rounded-lg px-6 py-3 font-semibold"
            >
              詳細プランを試す（決済へ）
            </Link>
          </div>
        </div>
      </section>

      {/* 使い方セクション */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-center">使い方はカンタン、3ステップ</h2>
        <div className="mt-10 grid md:grid-cols-3 gap-8 text-center">
          <div>
            <img src="/illustrations/step1.png" alt="入力" className="mx-auto w-24 h-24" />
            <h3 className="font-semibold mt-4">1. 入力する（1分）</h3>
            <p className="text-gray-600">身長・体重・年齢・生活習慣をカンタン入力。</p>
          </div>
          <div>
            <img src="/illustrations/step2.png" alt="AI診断" className="mx-auto w-24 h-24" />
            <h3 className="font-semibold mt-4">2. AIが診断</h3>
            <p className="text-gray-600">BMIとワンポイントアドバイスを自動生成。</p>
          </div>
          <div>
            <img src="/illustrations/step3.png" alt="結果表示" className="mx-auto w-24 h-24" />
            <h3 className="font-semibold mt-4">3. 結果を見る</h3>
            <p className="text-gray-600">その場で結果を表示。有料なら詳細プランも。</p>
          </div>
        </div>
      </section>

      {/* 無料版と有料版の比較 */}
      <section className="bg-white py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center">無料版と有料版の違い</h2>
          <div className="mt-10 grid md:grid-cols-2 gap-8">
            <div className="border rounded-lg p-6 text-center">
              <h3 className="text-xl font-semibold">無料版 ¥0</h3>
              <p className="mt-2 text-gray-600">BMI診断・ワンポイントアドバイス</p>
              <Link href="/free" className="mt-4 inline-block bg-pink-500 text-white px-5 py-2 rounded-lg">
                無料で診断する
              </Link>
            </div>
            <div className="border rounded-lg p-6 text-center">
              <h3 className="text-xl font-semibold">有料版 ¥500</h3>
              <ul className="mt-2 text-gray-600 space-y-1">
                <li>✓ 決済後すぐに詳細結果を表示</li>
                <li>✓ 1週間の食事プラン（朝・昼・夜・間食）</li>
                <li>✓ 運動プラン（有酸素＋筋トレ）</li>
                <li>✓ PDFをメール送付</li>
              </ul>
              <Link href="/pro" className="mt-4 inline-block bg-black text-white px-5 py-2 rounded-lg">
                詳細プランを試す（決済へ）
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* フッター */}
      <footer className="text-center text-gray-500 py-8 text-sm">
        ※本サービスは一般的な健康アドバイスの提供であり、医療行為ではありません。
        <br />
        <div className="mt-2 space-x-4">
          <Link href="/terms">利用規約</Link>
          <Link href="/privacy">プライバシーポリシー</Link>
          <Link href="/disclaimer">免責ページ</Link>
        </div>
        <p className="mt-4">© 2025 AI健康診断Bot</p>
      </footer>
    </main>
  );
}
