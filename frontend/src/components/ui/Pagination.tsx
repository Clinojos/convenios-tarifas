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
        className="cursor-pointer flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-medium text-slate-500 border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft size={14} />
        Anterior
      </button>

      <div className="flex items-center gap-1">
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`dots-${i}`} className="w-7 h-7 flex items-center justify-center text-[12px] text-slate-300">
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`cursor-pointer w-7 h-7 flex items-center justify-center rounded-full text-[12px] font-semibold transition-colors
                ${
                  p === page
                    ? "bg-navy text-white"
                    : "text-slate-500 hover:bg-slate-100"
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
        className="cursor-pointer flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-medium text-slate-500 border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        Siguiente
        <ChevronRight size={14} />
      </button>
    </div>
  );
}