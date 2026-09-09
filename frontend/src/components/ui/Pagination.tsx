"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

const MUTED = "#8A8F98";
const BORDER = "#E7E9EE";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  /** Total de items (para el texto "N ofertas · página X de Y"). Si no se pasa, no se muestra el conteo. */
  totalItems?: number;
  /** Nombre en singular del item, ej: "oferta". Se pluraliza agregando "s". */
  itemLabel?: string;
}

export function Pagination({ page, totalPages, onPageChange, totalItems, itemLabel = "resultado" }: PaginationProps) {
  if (totalPages <= 1) return null; // con 1 sola página no aporta nada, mejor ni mostrarla

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    onPageChange(p);
  };

  return (
    <div className="flex items-center justify-between mt-1 shrink-0">
      {totalItems !== undefined ? (
        <p className="text-[11px]" style={{ color: MUTED }}>
          {totalItems} {itemLabel}
          {totalItems !== 1 ? "s" : ""} · página {page} de {totalPages}
        </p>
      ) : (
        <p className="text-[11px]" style={{ color: MUTED }}>
          página {page} de {totalPages}
        </p>
      )}

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => goToPage(page - 1)}
          disabled={page === 1}
          className="cursor-pointer flex items-center gap-1 text-[11px] font-medium px-3 py-1.5 rounded-lg border disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white"
          style={{ borderColor: BORDER, color: MUTED }}
        >
          <ChevronLeft size={13} />
          Anterior
        </button>
        <button
          onClick={() => goToPage(page + 1)}
          disabled={page === totalPages}
          className="cursor-pointer flex items-center gap-1 text-[11px] font-medium px-3 py-1.5 rounded-lg border disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white"
          style={{ borderColor: BORDER, color: MUTED }}
        >
          Siguiente
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}