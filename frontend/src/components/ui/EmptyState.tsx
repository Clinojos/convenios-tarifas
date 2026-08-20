import { Ghost, LucideIcon } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: LucideIcon;
}

export function EmptyState({ 
  title = "¡Ups!", 
  message = "No encontramos resultados que coincidan con los filtros actuales.", 
  icon: Icon = Ghost 
}: EmptyStateProps) {
  return (
    <div className="h-[60vh] w-full flex flex-col items-center justify-center text-center px-4 animate-in fade-in zoom-in duration-500">
      <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-slate-100">
        <Icon size={48} className="text-slate-400" strokeWidth={1.5} />
      </div>
      <h3 className="text-slate-800 font-bold text-2xl mb-2">{title}</h3>
      <p className="text-slate-500 text-sm max-w-sm">
        {message}
      </p>
    </div>
  );
}