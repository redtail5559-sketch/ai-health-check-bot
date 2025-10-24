// 修正済みの diagnose/page.jsx 全文（構文エラー解消済み）

"use client";

import { useState, useMemo } from "react";
import Field from "../../components/Field.jsx";

const baseInput =
  "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100";
const baseLabel = "block text-sm font-medium text-gray-700 mb-1";
const row = "grid grid-cols-1 gap-4 sm:grid-cols-2";
const card = "rounded-2xl border border-white/40 bg-white/60 backdrop-blur p-5 sm:p-7 shadow-sm";

export default function Home() {
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [result, setResult] = useState(null);

  function validate(form) {
    const e = {};
    const height = Number(form.get("heightCm"));
    const weight = Number(form.get("weightKg"));
    const age = Number(form.get("age"));
    const sex = form.get("sex");
    const goal = form.get("goal");

    if (!height) e.heightCm = "身長を入力してください。";
    else if (height < 80 || height > 250) e.heightCm = "80〜250cm の範囲で入力してください。";

    if (!weight) e.weightKg = "体重を入力してください。";
    else if (weight < 20 || weight > 300) e.weightKg = "20〜300kg の範囲で入力してください。";

    if (!age) e.age = "年齢を入力してください。";
    else if (age < 5 || age > 120) e.age = "5〜120歳 の範囲で入力してください。";

    if (!sex) e.sex = "性別を選択してください。";

    if (!goal) e.goal = "目的を入力してください。";

    return e;
  }

  async function onSubmit(ev) {
    ev.preventDefault();
    setResult(null);
    const fd = new FormData(ev.currentTarget);
    const e = validate(fd);
    setErrors(e);
    if (Object.keys(e).length) return;

    const lifestyle = {
      drink: fd.get("drink") || "",
      smoke: fd.get("smoke") || "",
      activity: fd.get("activity") || "",
      sleep: fd.get("sleep") || "",
      diet: fd.get("diet") || "",
    };

    const payload = {
      heightCm: Number(fd.get("heightCm")),
      weightKg: Number(fd.get("weightKg")),
      age: Number(fd.get("age")),
      sex: fd.get("sex"),
      lifestyle,
      goal: fd.get("goal"),
    };

    try {
      setSubmitting(true);
      const res = await fetch("/api/free-advice", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json?.ok) throw new Error("診断でエラーが発生しました。");
      setResult(json.data);
    } catch (err) {
      setResult({
        bmi: null,
        category: "エラー",
        advice: "サーバーエラーが発生しました。しばらく経ってからお試しください。",
        tips: [],
        note: err.message,
      });
    } finally {
      setSubmitting(false);
    }
  }

  const header = useMemo(
    () => (
      <header className="mx-auto max-w-3xl px-4 pt-8 pb-3 sm:pt-10">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          AI健康診断Bot
        </h1>
        <p className="mt-2 text-gray-600">
          身長・体重などを入力すると、BMIとワンポイントアドバイスを表示します。
        </p>
      </header>
    ),
    []
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 via-indigo-50 to-blue-100">
      {header}

      <section className="mx-auto mb-8 max-w-3xl px-4">
        <form onSubmit={onSubmit} className={card} noValidate>
          <h2 className="text-lg font-semibold text-gray-900">基本情報</h2>
          <div className="mt-4 space-y-4">
            <div className={row}>
              <Field label="身長（cm）" error={errors.heightCm}>
                <input
                  type="number"
                  name="heightCm"
                  inputMode="decimal"
                  placeholder="例）170"
                  className={baseInput}
                />
              </Field>

              <Field label="体重（kg）" error={errors.weightKg}>
                <input
                  type="number"
                  name="weightKg"
                  inputMode="decimal"
                  placeholder="例）65"
                  className={baseInput}
                />
              </Field>
            </div>

            <div className={row}>
              <Field label="年齢（任意）" error={errors.age}>
                <input
                  type="number"
                  name="age"
                  inputMode="numeric"
                  placeholder="例）50"
                  className={baseInput}
                />
              </Field>

              <Field label="性別（任意）" error={errors.sex}>
                <select name="sex" className={baseInput} defaultValue="">
                  <option value="" disabled>選択してください</option>
                  <option value="男性">男性</option>
                  <option value="女性">女性</option>
                  <option value="その他">その他</option>
                </select>
              </Field>

              <Field label="目的（必須）" error={errors.goal}>
                <input
                  name="goal"
                  placeholder="例）体重を減らしたい"
                  className={baseInput}
                  required
                />
              </Field>
            </div>
          </div>

          {/* 詳細（任意） */}
          <details className="mt-6">
            <summary className="cursor-pointer select-none text-base font-semibold text-gray-900">
              詳細（任意）
            </summary>
            <div className="mt-4 grid grid-cols-1 gap-4">
              <Field label="飲酒（頻度・量）">
                <input name="drink" placeholder="例）週2回、ビール350ml ×2本" className={baseInput} />
              </Field>
              <Field label="喫煙（本数など）">
                <input name="smoke" placeholder="例）1日5本" className={baseInput} />
              </Field>
              <Field label="運動習慣（頻度・内容）">
                <input name="activity" placeholder="例）週3回 30分ジョギング" className={baseInput} />
              </Field>
              <Field label="睡眠（時間・質）">
                <input name="sleep" placeholder="例）6時間、途中で目が覚める" className={baseInput} />
              </Field>
              <Field label="食事（傾向や課題）">
                <input name="diet" placeholder="例）外食多め、夜食あり" className={baseInput} />
              </Field>
            </div>
          </details>

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full rounded-2xl bg-indigo-600 px-6 py-4 text-center text-base font-semibold text-white shadow-md transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:opacity-60"
          >
            {submitting ? "診断中…" : "無料で今日の健康診断"}
          </button>

          <p className="sr-only" aria-live="polite">
            {Object.keys(errors).length ? "入力に誤りがあります" : ""}
          </p>
        </form>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-12">
        {result && <ResultCard result={result} />}
      </section>

      <footer className="pb-10 text-center text-xs text-gray-500">
        <p className="px-4">
        ※ 本ツールは一般的なヘルスアドバイスの提供を目的としており、医療行為ではありません。
           体調に不安がある場合は医療機関にご相談ください。
      </p>
      </footer>
      </main>
  );
}
