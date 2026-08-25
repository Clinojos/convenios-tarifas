"use client";

import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

// ---------------------------------------------------------------------------
// Breadcrumb genérico — ícono + texto separados por chevron.
// El último item se considera "activo" (más oscuro, sin hover) salvo que
// se le pase onClick explícitamente.
// ---------------------------------------------------------------------------

export type BreadcrumbItem = {
  id: string;
  label: string;
  icon?: React.ElementType;
  onClick?: () => void;
};

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex shrink-0 items-center gap-1.5 overflow-x-auto rounded-2xl border border-slate-100 bg-white px-4 py-2.5 shadow-sm"
    >
      <ol className="flex items-center gap-1.5 whitespace-nowrap">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const Icon = item.icon;
          const clickable = !!item.onClick && !isLast;

          const content: ReactNode = (
            <span
              className={`flex items-center gap-1.5 text-[13px] font-medium transition-colors ${
                isLast
                  ? "text-slate-800"
                  : clickable
                  ? "cursor-pointer text-slate-400 hover:text-slate-700"
                  : "text-slate-400"
              }`}
            >
              {Icon && <Icon size={14} className="shrink-0" />}
              {item.label}
            </span>
          );

          return (
            <li key={item.id} className="flex items-center gap-1.5">
              {clickable ? (
                <button type="button" onClick={item.onClick}>
                  {content}
                </button>
              ) : (
                content
              )}
              {!isLast && (
                <ChevronRight size={14} className="shrink-0 text-slate-300" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}