export default function Loading() {
  return (
    <div className="max-w-[1400px] mx-auto p-4 space-y-4 flex flex-col h-full animate-pulse">
      {/* Header Skeleton - Mismo espacio que el real */}
      <div className="flex flex-col gap-2">
        <div className="space-y-2">
          <div className="h-[16px] w-32 bg-slate-100 rounded" />
          <div className="h-[12px] w-64 bg-slate-100 rounded" />
        </div>
        
        {/* Skeleton del FilterBar */}
        <div className="h-[46px] w-full bg-slate-50 rounded-2xl border border-slate-100" />
      </div>

      {/* Grid de tarjetas - Exactamente el mismo layout */}
      <div className="flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <div key={n} className="bg-white border border-slate-100 p-4 rounded-2xl flex flex-col gap-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 w-4/5 bg-slate-100 rounded" />
                  <div className="h-2 w-1/3 bg-slate-100 rounded" />
                </div>
              </div>
              <div className="mt-auto pt-3 border-t border-slate-50">
                <div className="h-2 w-1/4 bg-slate-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Paginación Skeleton - Posición fija al final */}
      <div className="flex items-center justify-center gap-3 pt-3 pb-2 border-t border-slate-100">
        <div className="w-8 h-8 rounded-full bg-slate-100" />
        <div className="w-16 h-6 rounded-full bg-slate-100" />
        <div className="w-8 h-8 rounded-full bg-slate-100" />
      </div>
    </div>
  );
}