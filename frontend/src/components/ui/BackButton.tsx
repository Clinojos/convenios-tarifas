"use client";

/**
 * BackButton
 * ---------------------------------------------------------------------------
 * Botón de "Atrás" que usa el historial del navegador (router.back()) en vez
 * de navegar a una ruta fija. Así se conserva el estado de la página anterior
 * (filtros, página de paginación, scroll, etc.) en lugar de recargarla.
 *
 * Si no hay historial previo (ej. el usuario entró directo por URL), cae
 * de vuelta a la ruta de fallback indicada.
 */

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

interface BackButtonProps {
  fallbackHref?: string;
  label?: string;
}

export function BackButton({ fallbackHref = "/convenios", label = "Atrás" }: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    // Si hay historial dentro de la app, volvemos ahí (conserva filtros/página).
    // Si no (ej. el usuario llegó directo por URL o abrió en pestaña nueva),
    // usamos la ruta de fallback.
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  };

  return (
    <button
      onClick={handleBack}
      className="cursor-pointer inline-flex items-center gap-1 text-[12px] text-slate-500 hover:text-primary transition-colors w-fit"
    >
      <ChevronLeft size={14} />
      {label}
    </button>
  );
}