"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function CheckoutSuccessClient() {
  const sp = useSearchParams();
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const sid =
      sp.get("session_id") ||
      sp.get("sessionId") ||
      sp.get("sid") ||
      "";

    if (!sid || !sid.startsWith("cs_")) {
      setError("sessionId が無効です");
      return;
    }

    console.log("✅ sessionId used for fetch:", sid);

    // ✅ APIルートを修正し、HTMLエラーを防御
    fetch(`/api/pro-success?session_id=${encodeURIComponent(sid)}`)
      .then(async (res) => {
        console.log("✅ fetch status:", res.status);
        if (!res.ok) {
          const fallbackText = await res.text();
          throw new Error(`APIエラー: ${fallbackText}`);
        }

        const json = await res.json();
        console.log("✅ full result:", json);

        if (!json.ok) {
          throw new Error(json.error || "診断データ取得に失敗しました");
        }

        setResult(json.data);
        console.log("✅ weekPlan:", json.data.weekPlan);
      })
      .catch((e) => {
        console.error("❌ 診断取得エラー:", e);
        setError(`診断データの取得に失敗しました: ${e.message}`);
      });
  }, []);

  if (error) return <div className="text-red-500">エラー: {error}</div>;
  if (!result) return <div>診断データを取得中...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">AI診断結果</h2>
      <p><strong>メール:</strong> {result.email}</p>
      <p><strong>BMI:</strong> {result.bmi}</p>
      <p><strong>概要:</strong> {result.overview}</p>

      <h3 className="text-lg font-semibold mt-4">目標</h3>
      <ul className="list-disc pl-5">
        {result.goals?.map((g, i) => (
          <li key={i}>{g}</li>
        ))}
      </ul>

      <h3 className="text-lg font-semibold mt-4">週間プラン（表形式）</h3>
      {Array.isArray(result.weekPlan) && result.weekPlan.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="table-auto w-full border border-gray-300 text-sm">
            <thead className="bg-gray-100">
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
              {result.weekPlan.map((day, i) => (
                <tr key={i}>
                  <td className="border px-2 py-1">{day.day}</td>
                  <td className="border px-2 py-1">{day.meals.breakfast}</td>
                  <td className="border px-2 py-1">{day.meals.lunch}</td>
                  <td className="border px-2 py-1">{day.meals.dinner}</td>
                  <td className="border px-2 py-1">{day.meals.snack}</td>
                  <td className="border px-2 py-1">
                    {day.workout.name}（{day.workout.minutes}分）
                  </td>
                  <td className="border px-2 py-1">{day.workout.tips}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500">週間プランが見つかりませんでした。</p>
      )}
    </div>
  );
}