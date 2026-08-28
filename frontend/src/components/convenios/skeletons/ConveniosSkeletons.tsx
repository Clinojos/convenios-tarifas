function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`rounded-xl bg-slate-100 ${className}`} />;
}

// Skeleton de la lista principal (/convenios)
export function ConveniosListSkeleton() {
  return (
    <div className="flex h-full flex-col gap-4 animate-pulse">
      <div className="flex flex-col gap-2">
        <SkeletonBlock className="h-4 w-40" />
        <SkeletonBlock className="h-3 w-64" />
        <SkeletonBlock className="mt-2 h-9 w-full rounded-full" />
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-32 w-full" />
        ))}
      </div>
    </div>
  );
}

// Skeleton de la vista de empresa (/convenios/empresa/[groupKey])
export function EmpresaConveniosSkeleton() {
  return (
    <div className="flex h-full flex-col gap-4 animate-pulse">
      <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm sm:p-4">
        <SkeletonBlock className="h-12 w-12 rounded-full shrink-0" />
        <div className="space-y-2 flex-1 min-w-0">
          <SkeletonBlock className="h-4 w-1/3" />
          <SkeletonBlock className="h-3 w-1/4" />
        </div>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-36 w-full" />
        ))}
      </div>
    </div>
  );
}

// Skeleton del detalle de un convenio (/convenios/[id])
export function ConvenioDetalleSkeleton() {
  return (
    <div className="flex h-full flex-col gap-4 animate-pulse">
      <div className="flex shrink-0 flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <SkeletonBlock className="h-12 w-12 rounded-full shrink-0" />
          <div className="space-y-2 flex-1 min-w-0">
            <SkeletonBlock className="h-4 w-1/3" />
            <SkeletonBlock className="h-3 w-1/4" />
          </div>
          <SkeletonBlock className="h-6 w-20 rounded-full hidden sm:block" />
        </div>
        <SkeletonBlock className="h-10 w-48 rounded-full shrink-0" />
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4 flex-1 min-w-0 space-y-3">
          <div className="flex items-center justify-between">
            <SkeletonBlock className="h-4 w-40" />
            <SkeletonBlock className="h-7 w-28 rounded-lg" />
          </div>
          <SkeletonBlock className="h-28 w-full" />
          <SkeletonBlock className="h-28 w-full" />
        </div>
      </div>
    </div>
  );
}