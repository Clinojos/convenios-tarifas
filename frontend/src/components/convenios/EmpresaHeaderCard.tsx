import { avatarColor } from "@/components/convenios/avatarColor";

interface EmpresaHeaderCardProps {
  name: string;
  totalCount: number;
  activeCount: number;
}

// Header de la vista "empresa" — avatar + nombre + badges de conteo.
export function EmpresaHeaderCard({ name, totalCount, activeCount }: EmpresaHeaderCardProps) {
  return (
    <div className="flex shrink-0 flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div
          className={`h-12 w-12 shrink-0 rounded-full flex items-center justify-center font-bold text-[17px] text-white ${avatarColor(
            name
          )}`}
        >
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-[17px] font-bold text-slate-800 tracking-tight">{name}</h1>
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-600">
              {totalCount} convenio{totalCount !== 1 ? "s" : ""}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-600">
              {activeCount}/{totalCount} activos
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}