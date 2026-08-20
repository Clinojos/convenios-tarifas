export default function Loading() {
  return (
    <div className="max-w-[1400px] mx-auto p-6 space-y-8 animate-pulse">
      {/* 1. Header con Tabs (Skeleton) */}
      <div className="flex justify-between items-end border-b border-slate-100 pb-4">
        <div className="space-y-4">
          <div className="h-6 w-48 bg-slate-100 rounded" />
          <div className="flex gap-6">
            <div className="h-4 w-24 bg-slate-100 rounded" />
            <div className="h-4 w-24 bg-slate-100 rounded" />
          </div>
        </div>
        <div className="h-9 w-32 bg-slate-100 rounded-xl" />
      </div>

      {/* 2. Sección Roles (Skeleton) */}
      <section className="space-y-4">
        <div className="h-3 w-32 bg-slate-100 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white border border-slate-100 p-5 rounded-2xl h-40 space-y-4">
              <div className="flex justify-between">
                <div className="w-10 h-10 rounded-xl bg-slate-100" />
                <div className="flex gap-2">
                  <div className="w-4 h-4 bg-slate-100 rounded" />
                  <div className="w-4 h-4 bg-slate-100 rounded" />
                </div>
              </div>
              <div className="h-4 w-24 bg-slate-100 rounded mt-4" />
              <div className="h-3 w-full bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      </section>

      {/* 3. Sección Permisos (Skeleton) */}
      <section className="pt-6 border-t border-slate-100 space-y-4">
        <div className="h-3 w-32 bg-slate-100 rounded" />
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="h-10 bg-white border border-slate-100 rounded-xl" />
          ))}
        </div>
      </section>
    </div>
  );
}