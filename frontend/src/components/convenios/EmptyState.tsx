import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  message: string;
}

// Patrón genérico de "no hay nada que mostrar" — hoy se usaba solo en la
// vista de empresa, pero queda listo para reusarse en cualquier listado.
export function EmptyState({ icon: Icon, message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white py-20">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50">
        <Icon size={18} className="text-slate-300" />
      </div>
      <p className="text-[13px] text-slate-400">{message}</p>
    </div>
  );
}