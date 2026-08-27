"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
}

function getPageNumbers(page: number, totalPages: number): (number | "...")[] {
  const delta = 1;
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
  if (totalPages <= 1) return null; // con 1 sola página no aporta nada, mejor ni mostrarla

  const pages = getPageNumbers(page, totalPages);

  return (
    <div className="flex items-center justify-center gap-1.5 py-1">
      <button
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
        aria-label="Página anterior"
        className="cursor-pointer flex h-8 w-8 items-center justify-center rounded-full text-slate-400 
                   transition-colors hover:bg-slate-100 hover:text-slate-700
                   disabled:opacity-0 disabled:pointer-events-none"
      >
        <ChevronLeft size={16} />
      </button>

      <div className="flex items-center gap-1">
        {pages.map((p, i) =>
          p === "..." ? (
            <span
              key={`dots-${i}`}
              className="w-8 h-8 flex items-center justify-center text-[12px] text-slate-300 select-none"
            >
              ···
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              aria-current={p === page ? "page" : undefined}
              className={`cursor-pointer h-8 w-8 flex items-center justify-center rounded-full text-[12.5px] font-semibold transition-all
                ${
                  p === page
                    ? "bg-primary text-white shadow-sm shadow-primary/30"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
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
        aria-label="Página siguiente"
        className="cursor-pointer flex h-8 w-8 items-center justify-center rounded-full text-slate-400
                   transition-colors hover:bg-slate-100 hover:text-slate-700
                   disabled:opacity-0 disabled:pointer-events-none"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}