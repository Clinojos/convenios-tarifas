"use client";

import { Eye, EyeOff } from "lucide-react";

interface SeccionHeaderProps {
  sectionKey: string;
  icon: React.ReactNode;
  titulo: string;
  hiddenSections: string[];
  isEditing: boolean;
  onToggle: (key: string) => void;
  className?: string;
}

/** Encabezado de sección dentro de un bloque existente (no es su propia card) */
export function SeccionHeader({
  sectionKey,
  icon,
  titulo,
  hiddenSections,
  isEditing,
  onToggle,
  className = "",
}: SeccionHeaderProps) {
  const isHidden = hiddenSections.includes(sectionKey);
  if (!isEditing && isHidden) return null;

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-slate-400 font-medium">
        {icon}
        {titulo}
      </div>
      {isEditing && (
        <button
          type="button"
          onClick={() => onToggle(sectionKey)}
          className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full transition-colors ${
            isHidden ? "bg-slate-100 text-slate-400" : "bg-primary/10 text-primary"
          }`}
        >
          {isHidden ? <EyeOff size={11} /> : <Eye size={11} />}
          {isHidden ? "Oculto" : "Visible"}
        </button>
      )}
    </div>
  );
}