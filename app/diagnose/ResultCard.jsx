// ファイルを app/diagnose/ResultCard.jsx に作成
export default function ResultCard({ result }) {
  return (
    <div>
      <h3>チェック結果</h3>
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </div>
  );
}