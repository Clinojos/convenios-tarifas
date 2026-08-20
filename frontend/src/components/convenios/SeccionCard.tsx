"use client";

import { Eye, EyeOff } from "lucide-react";

interface SeccionCardProps {
  sectionKey: string;
  icon: React.ReactNode;
  titulo: string;
  hiddenSections: string[];
  isEditing: boolean;
  onToggle: (key: string) => void;
  children: React.ReactNode;
}

/** Card independiente (Servicios, Documentos, Facturación, Autorización, Contacto) */
export function SeccionCard({
  sectionKey,
  icon,
  titulo,
  hiddenSections,
  isEditing,
  onToggle,
  children,
}: SeccionCardProps) {
  const isHidden = hiddenSections.includes(sectionKey);

  // en modo lectura, si está oculta, no se renderiza el bloque
  if (!isEditing && isHidden) return null;

  return (
    <div
      className={`bg-white border rounded-2xl shadow-sm p-4 ${
        isHidden ? "border-dashed border-slate-300" : "border-slate-100"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {icon}
          <h2 className="text-[13px] font-semibold text-navy">{titulo}</h2>
        </div>
        {isEditing && (
          <button
            type="button"
            onClick={() => onToggle(sectionKey)}
            className={`cursor-pointer inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full transition-colors ${
              isHidden ? "bg-slate-100 text-slate-400" : "bg-primary/10 text-primary"
            }`}
          >
            {isHidden ? <EyeOff size={11} /> : <Eye size={11} />}
            {isHidden ? "Mostrar sección" : "Ocultar sección"}
          </button>
        )}
      </div>
      <div className={`mt-2 text-[12px] text-slate-600 ${isHidden && isEditing ? "opacity-40" : ""}`}>
        {children}
      </div>
    </div>
  );
}