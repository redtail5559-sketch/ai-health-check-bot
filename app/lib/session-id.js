// app/lib/session-id.js
export function getOrCreateSessionId() {
  try {
    let sid = sessionStorage.getItem("sessionId");
    if (!sid) {
      sid = crypto.randomUUID();
      sessionStorage.setItem("sessionId", sid);
    }
    return sid;
  } catch {
    // SSRやEdgeでsessionStorage未使用の場合の保険
    return `sid_${Math.random().toString(36).slice(2)}`;
  }
}
