"use client";
import { useState } from "react";

export default function Page() {
  const [height, setHeight] = useState(""); // cm
  const [weight, setWeight] = useState(""); // kg
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("male");
  const [habit, setHabit] = useState({ alcohol: "なし", smoke: "なし", exercise: "週1以下", sleep: "6-7h", diet: "和食中心" });
  const [bmi, setBmi] = useState(null);
  const [tip, setTip] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    const h = Number(height) / 100;
    const w = Number(weight);
    if (!h || !w) return alert("身長・体重を入力してください");
    const bmiVal = (w / (h * h)).toFixed(1);
    setBmi(bmiVal);

    setLoading(true);
    try {
      const res = await fetch("/api/free-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          height_cm: Number(height),
          weight_kg: Number(weight),
          age: Number(age),
          sex,
          habit,
          bmi: Number(bmiVal),
        }),
      });
      const data = await res.json();
      setTip(data.tip || "アドバイスの取得に失敗しました。");
    } catch (e) {
      setTip("エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: 680, margin: "40px auto", padding: 16 }}>
      <h1>AI健康診断Bot（無料版）</h1>
      <p>身長・体重などを入力すると、BMIとワンポイントアドバイスを表示します。</p>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, marginTop: 16 }}>
        <label>身長（cm）<input value={height} onChange={e=>setHeight(e.target.value)} type="number" step="0.1" required /></label>
        <label>体重（kg）<input value={weight} onChange={e=>setWeight(e.target.value)} type="number" step="0.1" required /></label>
        <label>年齢<input value={age} onChange={e=>setAge(e.target.value)} type="number" min="0" /></label>
        <label>性別
          <select value={sex} onChange={e=>setSex(e.target.value)}>
            <option value="male">男性</option>
            <option value="female">女性</option>
            <option value="other">その他</option>
          </select>
        </label>
        <fieldset style={{ border: "1px solid #ddd", padding: 12 }}>
          <legend>生活習慣</legend>
          <label>飲酒
            <select value={habit.alcohol} onChange={e=>setHabit(h=>({...h, alcohol:e.target.value}))}>
              <option>なし</option><option>週1-2</option><option>週3-5</option><option>ほぼ毎日</option>
            </select>
          </label>
          <label>喫煙
            <select value={habit.smoke} onChange={e=>setHabit(h=>({...h, smoke:e.target.value}))}>
              <option>なし</option><option>時々</option><option>毎日</option>
            </select>
          </label>
          <label>運動頻度
            <select value={habit.exercise} onChange={e=>setHabit(h=>({...h, exercise:e.target.value}))}>
              <option>週1以下</option><option>週2-3</option><option>週4以上</option>
            </select>
          </label>
          <label>睡眠
            <select value={habit.sleep} onChange={e=>setHabit(h=>({...h, sleep:e.target.value}))}>
              <option>6-7h</option><option>7-8h</option><option>5h以下</option>
            </select>
          </label>
          <label>食事傾向
            <select value={habit.diet} onChange={e=>setHabit(h=>({...h, diet:e.target.value}))}>
              <option>和食中心</option><option>外食多め</option><option>炭水化物多め</option><option>高たんぱく意識</option>
            </select>
          </label>
        </fieldset>
        <button type="submit" disabled={loading}>{loading ? "分析中…" : "無料で今日の健康診断"}</button>
      </form>

      {bmi && (
        <div style={{ marginTop: 24, padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
          <h2>BMI結果: {bmi}</h2>
          <p>（計算式：体重(kg) / [身長(m)]²）</p>
          <p style={{whiteSpace:"pre-wrap"}}>{tip}</p>
          <a href="#" onClick={(e)=>{e.preventDefault(); alert("有料版はこのあとStripe Checkoutに接続します。");}}>
            500円で1週間プランを受け取る →
          </a>
        </div>
      )}
    </main>
  );
}
