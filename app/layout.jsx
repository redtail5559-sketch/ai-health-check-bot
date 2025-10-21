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
      </body>
    </html>
  );
}
