// components/skeletons/DashboardSkeleton.tsx
export default function DashboardSkeleton() {
  return (
    <div className="max-w-[1400px] mx-auto space-y-6 p-6 font-sans animate-pulse">
      {/* KPIs Grid */}
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-slate-200 rounded-2xl" />
        ))}
      </div>
      {/* Charts Grid */}
      <div className="grid grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-[230px] bg-white border border-slate-100 rounded-2xl" />
        ))}
        <div className="col-span-3 h-[230px] bg-white border border-slate-100 rounded-2xl" />
      </div>
    </div>
  );
}