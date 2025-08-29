export const metadata = {
  title: "AI Health Check Bot",
  description: "AIを使った健康診断Bot",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: 24 }}>
        {children}
      </body>
    </html>
  );
}
