// app/api/ai-plan/route.js
// -------------- 実行/キャッシュ方針 --------------
export const runtime = "nodejs";           // ← Edge から Node に変更（安定化）
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { randomInt } from "crypto";        // Node の乱数

/* -------------------- 小さいユーティリティ -------------------- */
// シード付き擬似乱数（Node/Edge両対応）
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function pickUnique(n, arr, rnd) {
  const pool = [...arr];
  const out = [];
  for (let i = 0; i < n && pool.length; i++) {
    const idx = Math.floor(rnd() * pool.length);
    out.push(pool.splice(idx, 1)[0]); // 非復元抽出
  }
  return out;
}
function dayKeys() {
  return ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
}
function isPlan(obj) {
  const keys = dayKeys();
  try {
    return keys.every((k) => {
      const d = obj?.[k];
      return (
        d &&
        typeof d.breakfast === "string" &&
        typeof d.lunch === "string" &&
        typeof d.dinner === "string" &&
        typeof d.workout === "string" &&
        typeof d.tips === "string"
      );
    });
  } catch {
    return false;
  }
}
function hasDup(a) {
  const s = new Set(a);
  return s.size !== a.length;
}

/* -------------------- フォールバックの手作りプラン -------------------- */
function fallbackPlan(seed = Date.now()) {
  const rnd = mulberry32(seed);
  const BF = [
    "納豆＋卵かけご飯","オートミール粥＋味噌汁","ヨーグルト＋バナナ","トースト＋茹で卵",
    "鮭おにぎり＋野菜スープ","フルーツ＋カッテージチーズ","和風おかゆ＋梅干し",
  ];
  const LU = [
    "蕎麦＋温玉","鶏胸のサラダボウル","焼き魚定食（ご飯小）","野菜たっぷり味噌ラーメン（麺少なめ）",
    "チキンブリトー（野菜多め）","きのこパスタ（小盛り）","豆腐ステーキ＆ひじき",
  ];
  const DI = [
    "豚の生姜焼き＋キャベツ","鮭の塩焼き＋ほうれん草おひたし","鶏団子スープ＋玄米","野菜たっぷり鍋",
    "麻婆豆腐（ご飯少なめ）","冷しゃぶサラダ","サバ味噌＋小鉢2品",
  ];
  const WO = [
    "スクワット15回×3＋プランク60秒×2","早歩き30分","体幹サーキット10分","ランジ左右10回×3＋腕立て10回×2",
    "縄跳び3分×3（休憩1分）","ストレッチ15分＋ヒップヒンジ練習","自重筋トレ全身20分",
  ];
  const TP = [
    "食事はゆっくり20分以上。よく噛む。","水分をこまめに200ml×6～8回。","寝る90分前に入浴で体温リズム調整。",
    "タンパク質を毎食20g目安に。","おやつは素焼きナッツや高カカオ。","昼の散歩で日光を浴びる。","就寝前はスマホの光を控えめに。",
  ];

  const b = pickUnique(7, BF, rnd);
  const l = pickUnique(7, LU, rnd);
  const d = pickUnique(7, DI, rnd);
  const w = pickUnique(7, WO, rnd);
  const t = pickUnique(7, TP, rnd);

  const days = dayKeys();
  const plan = {};
  for (let i = 0; i < days.length; i++) {
    plan[days[i]] = { breakfast: b[i], lunch: l[i], dinner: d[i], workout: w[i], tips: t[i] };
  }
  return plan;
}

/* -------------------- OpenAI 呼び出し（寛容化版） -------------------- */
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function callOpenAI({ profile, seed }) {
  if (!process.env.OPENAI_API_KEY) return null;

  const system =
    "あなたは栄養と運動のアドバイザーです。" +
    "7日分の食事(朝/昼/夕)と運動を、日本の家庭で用意しやすい内容で出力。" +
    "各曜日で重複しないこと。各日1行のTipsも付与。出力は日本語。";

  const prompt = `
以下の形式の JSON だけを返してください（前後に説明やコードフェンスは不要）:
{
  "mon": {"breakfast":"...", "lunch":"...", "dinner":"...", "workout":"...", "tips":"..."},
  "tue": {...},
  "wed": {...},
  "thu": {...},
  "fri": {...},
  "sat": {...},
  "sun": {...}
}
プロフィール: ${JSON.stringify(profile || {}, null, 2)}
`;

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.9,
    seed, // バリエーションを持たせる
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: prompt },
    ],
  });

  const text = res.choices?.[0]?.message?.content ?? "";
  let obj = null;
  try {
    obj = JSON.parse(text);
  } catch {
    const m = text.match(/\{[\s\S]*\}/);
    if (m) {
      try { obj = JSON.parse(m[0]); } catch {}
    }
  }
  return obj;
}

/* -------------------- メイン -------------------- */
export async function POST(req) {
  try {
    // 入力
    let body = {};
    try { body = await req.json(); } catch { body = {}; }
    const profile = body?.profile || null;

    // 安定した乱数（毎回変わる）。EdgeのMath.random依存を避ける
    const seed = randomInt(1, 2 ** 31 - 1);

    // 1) まず AI に頼む（失敗してもフォールバックで絶対返す）
    let plan = await callOpenAI({ profile, seed });

    // 2) 壊れていたらフォールバック
    if (!isPlan(plan)) {
      plan = fallbackPlan(seed);
    }

    // 3) 最終チェック：各列で重複が無いよう補正
    const days = dayKeys();
    const fixFields = ["breakfast", "lunch", "dinner", "workout", "tips"];
    const pools = fallbackPlan(seed + 7); // 予備プール
    for (const f of fixFields) {
      const values = days.map((k) => String(plan[k]?.[f] || ""));
      if (hasDup(values)) {
        for (let i = 0; i < days.length; i++) {
          plan[days[i]][f] = pools[days[i]][f];
        }
      }
    }

    return NextResponse.json(
      { ok: true, plan, seed },
      { status: 200, headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (e) {
    console.error("AIプラン生成エラー:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Unknown error" },
      { status: 400, headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }
}
