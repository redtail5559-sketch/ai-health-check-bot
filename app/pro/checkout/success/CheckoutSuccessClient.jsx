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
          throw new Error(json.error || "チェックデータ取得に失敗しました");
        }

        setResult(json.data);
        console.log("✅ weekPlan:", json.data.weekPlan);
      })
      .catch((e) => {
        console.error("❌ チェック取得エラー:", e);
        setError(`チェックデータの取得に失敗しました: ${e.message}`);
      });
  }, []);

  if (error) return <div className="text-red-500">エラー: {error}</div>;
  if (!result) return <div>チェックデータを取得中...</div>;

  const roundedBmi =
    typeof result.bmi === "number"
      ? Math.round(result.bmi * 100) / 100
      : result.bmi;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">AIチェック結果</h2>
      <p><strong>メール:</strong> {result.email}</p>
      <p><strong>BMI:</strong> {roundedBmi}</p>
      <p><strong>概要:</strong> {result.overview}</p>

      <p><strong>目標:</strong> {Array.isArray(result.goals) && result.goals.length > 0 ? result.goals.join("、") : "未設定"}</p>

      <h3 className="text-lg font-semibold mt-4">週間プラン</h3>
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
                  <td className="border px-2 py-1">{day.meals?.breakfast || "未設定"}</td>
                  <td className="border px-2 py-1">{day.meals?.lunch || "未設定"}</td>
                  <td className="border px-2 py-1">{day.meals?.dinner || "未設定"}</td>
                  <td className="border px-2 py-1">{day.meals?.snack || "未設定"}</td>
                  <td className="border px-2 py-1">
                    {day.workout?.name || "未設定"}（{day.workout?.minutes || 0}分）
                  </td>
                  <td className="border px-2 py-1">{day.workout?.tips || "なし"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500">週間プランが見つかりませんでした。</p>
      )}

      <div className="mt-6">
        <button
          disabled={!result}
          className={`px-4 py-2 rounded text-white ${
            result ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"
          }`}
          onClick={async () => {
            if (!result || typeof result !== "object") {
              alert("チェックデータが取得できていません。再読み込みしてください。");
              return;
            }

            try {
              const res = await fetch("/api/pdf-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(result),
              });

              let json;
              try {
                json = await res.json();
              } catch (e) {
                const fallbackText = await res.text();
                throw new Error(`PDF送信APIエラー: ${fallbackText}`);
              }

              if (!res.ok || !json.ok) {
                throw new Error(json.error || "PDF送信に失敗しました");
              }

              alert("PDFをメール送信しました！");
            } catch (e) {
              console.error("❌ PDF送信エラー:", e);
              alert("送信に失敗しました: " + e.message);
            }
          }}
        >
          PDFをメール送信する
        </button>
      </div>
    </div>
  );
}