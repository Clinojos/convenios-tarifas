"use client";

interface SeccionHeaderProps {
  icon: React.ReactNode;
  titulo: string;
  className?: string;
}

/** Encabezado de sección dentro de un bloque existente (no es su propia card) */
export function SeccionHeader({ icon, titulo, className = "" }: SeccionHeaderProps) {
  return (
    <div className={`flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-slate-400 font-medium ${className}`}>
      {icon}
      {titulo}
    </div>
  );
}