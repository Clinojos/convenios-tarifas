// components/ui/Pagination.tsx
"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
}

function getPageNumbers(page: number, totalPages: number): (number | "...")[] {
  const delta = 1; // páginas vecinas a mostrar a cada lado de la actual
  const range: (number | "...")[] = [];

  for (let i = 1; i <= totalPages; i++) {
    const isEdge = i === 1 || i === totalPages;
    const isNearCurrent = i >= page - delta && i <= page + delta;

    if (isEdge || isNearCurrent) {
      range.push(i);
    } else if (range[range.length - 1] !== "...") {
      range.push("...");
    }
  }

  return range;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages === 0) return null; // solo ocultar si no hay datos

  const pages = getPageNumbers(page, totalPages);

  return (
    <div className="flex items-center justify-center gap-1.5 pt-3 pb-2 border-t border-slate-100">
      <button
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
        className="cursor-pointer flex items-center gap-1 text-[11px] font-medium px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:border-slate-300 hover:text-slate-800 transition-colors"
      >
        <ChevronLeft size={13} />
        Anterior
      </button>

      <div className="flex items-center gap-1 mx-1">
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`dots-${i}`} className="w-8 h-8 flex items-center justify-center text-[12px] text-slate-300 select-none">
              ···
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              aria-current={p === page ? "page" : undefined}
              className={`cursor-pointer w-8 h-8 flex items-center justify-center rounded-lg text-[12.5px] font-semibold border transition-colors
                ${
                  p === page
                    ? "bg-navy border-navy text-white shadow-sm"
                    : "border-transparent text-slate-500 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-700"
                }`}
            >
              {p}
            </button>
          )
        )}
      </div>

      <button
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="cursor-pointer flex items-center gap-1 text-[11px] font-medium px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:border-slate-300 hover:text-slate-800 transition-colors"
      >
        Siguiente
        <ChevronRight size={13} />
      </button>
    </div>
  );
}