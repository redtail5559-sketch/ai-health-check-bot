import "./globals.css";

export const metadata = {
  title: "AI Health Check Bot",
  description: "AIを使った健康診断Bot",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-gradient-to-br from-pink-50 via-indigo-50 to-blue-100">
        <main className="mx-auto max-w-2xl">{children}</main>

        {/* --- Build badge (常時表示) --- */}
        <div
          style={{
            position: "fixed",
            bottom: 8,
            right: 8,
            zIndex: 9999,
            background: "#111827",
            color: "#fff",
            fontSize: 12,
            padding: "4px 8px",
            borderRadius: 6,
            opacity: 0.9,
            fontFamily: "monospace",
          }}
        >
          build:
          {(process.env.VERCEL_GIT_COMMIT_SHA || "").slice(0, 7) || "local"}
        </div>
      </body>
    </html>
  );
}
