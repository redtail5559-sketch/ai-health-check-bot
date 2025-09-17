"use client";

import { useEffect, useState } from "react";

export default function SuccessPage() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // TODO: 実際には Stripe から受け取るユーザーデータを埋める
    const fetchReport = async () => {
      try {
        const res = await fetch("/api/pro-advice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            heightCm: 170,
            weightKg: 70,
            age: 40,
            sex: "男性",
            lifestyle: {
              drink: "週2回、ビール350ml×2本",
              smoke: "なし",
              activity: "週2回 30分の早歩き",
              sleep: "6時間",
              diet: "夜食あり、野菜少なめ",
            },
            email: "user@example.com", // Stripeの購入メールをここに入れる予定
          }),
        });

        const { ok, data, error } = await res.json();
        if (!ok) throw new Error(error);
        setReport(data);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchReport();
  }, []);

  if (error) return <div className="p-6 text-red-500">エラー: {error}</div>;
  if (!report) return <div className="p-6">診断レポートを生成中...</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">あなた専用の診断レポート</h1>
      <p>{report.overview}</p>

      <h2 className="text-lg font-semibold">今週の目標</h2>
      <ul className="list-disc pl-5">
        {report.goals?.map((g, i) => <li key={i}>{g}</li>)}
      </ul>

      <h2 className="text-lg font-semibold">1週間の食事・運動プラン</h2>
      <div className="space-y-3">
        {report.weekPlan?.map((d, i) => (
          <div key={i} className="border p-3 rounded">
            <h3 className="font-medium">{d.day}</h3>
            <p>朝食: {d.meals.breakfast}</p>
            <p>昼食: {d.meals.lunch}</p>
            <p>夕食: {d.meals.dinner}</p>
            <p>間食: {d.meals.snack}</p>
            <p>
              運動: {d.workout.name} {d.workout.minutes}分 ({d.workout.intensity})
            </p>
            <p className="text-sm text-gray-500">Tips: {d.workout.tips}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
