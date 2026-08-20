export default function RatesSkeleton() {
  return (
    <div className="max-w-[1400px] mx-auto p-6 space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-slate-200 rounded" />
          <div className="h-4 w-72 bg-slate-200 rounded" />
        </div>
        <div className="h-10 w-32 bg-slate-200 rounded-lg" />
      </div>
      
      {/* Buscador */}
      <div className="h-10 w-full bg-slate-200 rounded-xl" />

      {/* Tabla */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6">
        <div className="h-8 bg-slate-100 rounded-md mb-4" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-14 bg-slate-50 rounded-lg mb-2" />
        ))}
      </div>
    </div>
  );
}