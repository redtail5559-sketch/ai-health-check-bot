"use client";
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-purple-50">
      {/* Hero セクション */}
      <section className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-8 items-center">
        {/* 左側文章 */}
        <div>
          <span className="text-pink-500 font-semibold">無料で1分診断</span>
          <h1 className="text-4xl font-bold mt-2 leading-snug">
            AI健康診断 Bot 🎉 <br />
            <span className="text-purple-600">入力するだけで</span> 今日の健康チェック
          </h1>
          <p className="mt-4 text-gray-600">
            身長・体重・生活習慣を入力すると、AIがBMIとワンポイントアドバイスを返します。
            さらに有料版なら1週間の食事・運動プランをPDFでお届け。
          </p>
          <div className="mt-6 flex gap-4">
            <Link
              href="/free"
              className="bg-pink-500 text-white px-6 py-3 rounded-lg shadow hover:bg-pink-600"
            >
              無料で診断してみる →
            </Link>
            <Link
              href="#features"
              className="border px-6 py-3 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              できることを見る
            </Link>
          </div>
          <p className="mt-2 text-xs text-gray-400">
            ※本サービスは医療行為ではありません。
          </p>
        </div>
        {/* 右側イラスト */}
        <div className="flex justify-center">
          <Image
            src="/hero-ai.png"
            alt="AI Health Bot"
            width={400}
            height={400}
            className="rounded-lg"
          />
        </div>
      </section>

      {/* 使い方 3ステップ */}
      <section id="features" className="bg-white py-16">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold mb-8">使い方はカンタン、3ステップ</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="p-6 border rounded-lg bg-gray-50">
              <Image
                src="/step-input.png"
                alt="Step 1 入力"
                width={120}
                height={120}
                className="mx-auto mb-4"
              />
              <h3 className="font-semibold">1. 入力する 1分</h3>
              <p className="text-sm text-gray-600">
                身長・体重・年齢・生活習慣をサクッと入力。
              </p>
            </div>
            {/* Step 2 */}
            <div className="p-6 border rounded-lg bg-gray-50">
              <Image
                src="/step-ai.png"
                alt="Step 2 AI診断"
                width={120}
                height={120}
                className="mx-auto mb-4"
              />
              <h3 className="font-semibold">2. AIが診断 自動</h3>
              <p className="text-sm text-gray-600">
                AIがBMIとワンポイントアドバイスを自動生成。
              </p>
            </div>
            {/* Step 3 */}
            <div className="p-6 border rounded-lg bg-gray-50">
              <Image
                src="/step-result.png"
                alt="Step 3 結果表示"
                width={120}
                height={120}
                className="mx-auto mb-4"
              />
              <h3 className="font-semibold">3. 結果を見る 即時</h3>
              <p className="text-sm text-gray-600">
                その場で結果を表示。さらに詳しく知りたい人は有料へ。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 無料版と有料版の違い */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-center mb-10">
          無料版と有料版の違い
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="p-6 border rounded-lg bg-white shadow">
            <h3 className="font-bold text-lg">無料版 ¥0</h3>
            <ul className="mt-4 text-gray-600 space-y-2">
              <li>BMI診断</li>
              <li>ワンポイントアドバイス</li>
            </ul>
            <Link
              href="/free"
              className="mt-6 block bg-purple-600 text-white text-center px-6 py-3 rounded-lg hover:bg-purple-700"
            >
              無料で診断する
            </Link>
          </div>

          <div className="p-6 border rounded-lg bg-white shadow">
            <h3 className="font-bold text-lg">有料版 ¥500</h3>
            <ul className="mt-4 text-gray-600 space-y-2">
              <li>決済後すぐに表示 & PDFをメール送付</li>
              <li>1週間の食事プラン（朝・昼・夜・間食）</li>
              <li>運動プラン（有酸素＋筋トレ）</li>
              <li>PDFレポートをメールでお届け</li>
            </ul>
            <Link
              href="/pro"
              className="mt-6 block bg-pink-500 text-white text-center px-6 py-3 rounded-lg hover:bg-pink-600"
            >
              詳細プランを試す（決済へ）
            </Link>
          </div>
        </div>
      </section>

      {/* サンプルレポート */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold mb-6">こんなレポートが届きます</h2>
          <Image
            src="/pro-sample.png"
            alt="サンプルレポート"
            width={400}
            height={400}
            className="mx-auto rounded-lg shadow"
          />
          <p className="mt-4 text-gray-600">
            ・食事は量・メニューまで具体的に（例: 朝はオートミール＋ヨーグルト）
            <br />
            ・運動は曜日ごとのメニュー提案（有酸素150分/週＋筋トレ2日）
            <br />
            ・メールにPDFを添付。あとから見返して続けやすい
          </p>
        </div>
      </section>
    </main>
  );
}
