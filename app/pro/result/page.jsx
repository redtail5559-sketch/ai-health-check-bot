// app/pro/result/page.jsx
import Image from "next/image";
import Link from "next/link";
import ResultClient from "./ResultClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export default function Page({ searchParams }) {
  // SSRでemailを確実に受け取る
  const emailParam =
    typeof searchParams?.email === "string" ? searchParams.email.trim() : "";

  return (
    <div className="pro-result mx-auto max-w-2xl px-4 py-6 pb-28">
    //  {/* SSRデバッグ帯 */}
    //  <div
    //    style={{
    //      position: "fixed",
    //      top: 0,
    //      left: 0,
    //      right: 0,
    //      zIndex: 9999,
    //      background: "#e0f2fe",
    //      color: "#0369a1",
    //      fontSize: 12,
    //      padding: "6px 10px",
    //      borderBottom: "1px solid #bae6fd",
    //    }}
    //  >
    //    <strong>SSR DEBUG</strong>{" "}
    //    emailParam: <code>{emailParam || "(empty)"}</code>
    //  </div>

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
          <p className="text-sm text-gray-500">
            食事とワークアウトの7日メニュー
          </p>
        </div>
      </div>

      {/* ✅ emailParamをpropsとして確実に渡す */}
      <ResultClient email={emailParam} />
      
      // app/pro/result/page.jsx の return 内（<ResultClient email={emailParam} /> の直後）
<script
  dangerouslySetInnerHTML={{
    __html: `
(function(){
  function log(m){ try{ console.log("[result-boot]", m); }catch(e){} }
  try{
    var usp = new URLSearchParams(location.search || "");
    var email = (usp.get("email") || "").trim();
    var sid = (usp.get("session_id") || usp.get("sessionId") || "").trim();
    var SSKEY = "result.email";

    // まず sessionStorage を候補に
    if(!email){
      try{ email = (sessionStorage.getItem(SSKEY) || "").trim(); }catch(e){}
    }

    function setEmail(val){
      if(!val) { log("no email resolved"); return; }
      try{ sessionStorage.setItem(SSKEY, val); }catch(e){}
      var input = document.getElementById("email");
      if (input) {
        input.value = val;
        // React の controlled input に伝える
        try{ input.dispatchEvent(new Event("input", { bubbles: true })); }catch(e){}
        log("set email: " + val);
      } else {
        log("input#email not found");
      }
    }

    async function lookupBySession(id){
      try{
        var r = await fetch("/api/checkout-session-lookup?session_id=" + encodeURIComponent(id), { cache: "no-store" });
        var t = await r.text();
        log("lookup resp: " + t);
        if(!t) return "";
        try{
          var d = JSON.parse(t);
          return (d && d.email) ? String(d.email).trim() : "";
        }catch(e){ return ""; }
      }catch(e){
        log("lookup fail: " + e);
        return "";
      }
    }

    (async function run(){
      if(email){ setEmail(email); return; }
      if(sid){
        var fromStripe = await lookupBySession(sid);
        if(fromStripe){ setEmail(fromStripe); return; }
      }
      log("no email from url/session/stripe");
    })();
  }catch(e){
    console.error("[result-boot] fatal", e);
  }
})();
    `,
  }}
/>

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
