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