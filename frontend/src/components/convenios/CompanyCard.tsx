"use client";

import { Hash, FileBarChart, ChevronRight } from "lucide-react";
import { avatarColor } from "@/components/convenios/avatarColor";

export interface ConvenioVariant {
  contract_key: string;
  name: string;
  status: string;
  total_procedures?: number;
}

interface CompanyCardProps {
  variant: ConvenioVariant;
  onOpen: (contractKey: string) => void;
}

// Tarjeta individual de convenio dentro de la grilla de una empresa
// (antes vivía inline en el .map() de la página de empresa).
export function CompanyCard({ variant, onOpen }: CompanyCardProps) {
  const isActive = variant.status === "Activo";

  const handleOpen = () => onOpen(variant.contract_key);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleOpen();
      }}
      className="group cursor-pointer rounded-2xl border border-slate-100 bg-white p-4 shadow-sm
                 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold text-[12px] text-white ${avatarColor(
              variant.name ?? ""
            )}`}
          >
            {variant.name?.charAt(0).toUpperCase() ?? "?"}
          </div>
          <h3 className="truncate text-[13px] font-semibold text-slate-800">{variant.name}</h3>
        </div>
        <ChevronRight
          size={15}
          className="mt-1 shrink-0 text-slate-300 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary/60"
        />
      </div>

      <div className="mt-2 flex items-center gap-1.5 pl-[42px] text-[11px] text-slate-400">
        <Hash size={11} className="text-slate-300" />
        <span className="truncate">{variant.contract_key}</span>
      </div>

      <div className="mt-3 pl-[42px]">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
            isActive ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-slate-300"}`} />
          {isActive ? "Activo" : "Inactivo"}
        </span>
      </div>

      <div className="mt-3.5 flex items-center gap-1.5 border-t border-slate-50 pt-3 text-[11px] text-slate-500">
        <FileBarChart size={12} className="text-primary/50" />
        <span>
          <span className="font-semibold text-slate-700">{(variant.total_procedures ?? 0).toLocaleString()}</span>{" "}
          procedimientos tarifados
        </span>
      </div>
    </div>
  );
}