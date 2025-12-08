// app/pro/result/page.jsx
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export default async function Page({ searchParams }) {
  const sid = typeof searchParams?.sessionId === "string" ? searchParams.sessionId.trim() : "";
  const emailParam = typeof searchParams?.email === "string" ? searchParams.email.trim() : "";

  let plan = [];
  let error = "";
  let email = emailParam;

  if (!sid) {
    error = "URLにsessionIdが含まれていません";
  } else {
    try {
      const res = await fetch(`http://localhost:3000/api/pro-result?sessionId=${encodeURIComponent(sid)}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (json.ok && Array.isArray(json.data?.weekPlan)) {
        plan = json.data.weekPlan;
        email = json.data.email || emailParam;
      } else {
        error = json?.error || "チェック結果の取得に失敗しました";
      }
    } catch (e) {
      error = String(e?.message || e);
    }
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

      {/* 表形式メニュー */}
      {error && <div className="alert text-red-600 mb-4">エラー: {error}</div>}
      {plan.length > 0 && (
        <table className="table-auto text-sm border-collapse border border-gray-300 mb-6">
          <thead>
            <tr>
              <th className="border px-2 py-1">曜日</th>
              <th className="border px-2 py-1">朝食</th>
              <th className="border px-2 py-1">昼食</th>
              <th className="border px-2 py-1">夕食</th>
              <th className="border px-2 py-1">間食</th>
              <th className="border px-2 py-1">運動</th>
              <th className="border px-2 py-1">Tips</th>
            </tr>
          </thead>
          <tbody>
            {plan.map((d, i) => (
              <tr key={i}>
                <td className="border px-2 py-1">{d.day}</td>
                <td className="border px-2 py-1">{d.meals?.breakfast}</td>
                <td className="border px-2 py-1">{d.meals?.lunch}</td>
                <td className="border px-2 py-1">{d.meals?.dinner}</td>
                <td className="border px-2 py-1">{d.meals?.snack}</td>
                <td className="border px-2 py-1">{d.workout?.name}（{d.workout?.minutes}分）</td>
                <td className="border px-2 py-1">{d.workout?.tips || "（未設定）"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

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