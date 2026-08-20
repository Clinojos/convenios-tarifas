// app/contracts/loading.tsx
export default function Loading() {
  return (
    <div className="max-w-[1400px] mx-auto p-6 space-y-6">
      <div className="animate-pulse space-y-2">
        <div className="h-6 w-32 bg-slate-100 rounded" />
        <div className="h-4 w-64 bg-slate-100 rounded" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div key={n} className="bg-white border border-slate-100 p-5 rounded-2xl h-32 animate-pulse">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-slate-100 rounded" />
                <div className="h-3 w-1/2 bg-slate-100 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}