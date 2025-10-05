// app/pro/result/loading.jsx
export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 text-lg font-semibold">AIがレポートを作成中、しばらくお待ちください…</div>

      {/* 簡易スケルトン */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-white p-4">
            <div className="mb-3 h-4 w-24 animate-pulse rounded bg-gray-200" />
            <div className="space-y-2">
              <div className="h-3 w-3/4 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
