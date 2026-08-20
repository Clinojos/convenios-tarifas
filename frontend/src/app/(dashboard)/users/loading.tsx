export default function Loading() {
  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8 space-y-8 font-sans">
      <div className="flex items-end justify-between">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-10 w-32 bg-gray-200 rounded-xl animate-pulse" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-40 bg-gray-100 border border-gray-200 rounded-xl animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}