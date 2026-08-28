"use client";

import { Hash, FileBarChart } from "lucide-react";
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
      className="group h-full flex flex-col bg-white border border-slate-100 p-3.5 rounded-2xl hover:border-primary/20 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-[14px] text-white shrink-0 ${avatarColor(
            variant.name ?? ""
          )}`}
        >
          {variant.name?.charAt(0).toUpperCase() ?? "?"}
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <h3
            title={variant.name}
            className="text-[13.5px] font-semibold text-navy leading-snug line-clamp-2 group-hover:text-primary transition-colors"
          >
            {variant.name}
          </h3>
          <p className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5 truncate">
            <Hash size={10} className="shrink-0 text-slate-300" />
            {variant.contract_key}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-[11.5px]">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? "bg-green" : "bg-slate-300"}`} />
        <span className="text-slate-500 font-medium">{isActive ? "Activo" : "Inactivo"}</span>
      </div>

      <div className="mt-auto pt-3 border-t border-slate-50 flex items-center gap-1.5 text-[12px] text-slate-600 font-medium">
        <FileBarChart size={13} className="text-primary/60 shrink-0" />
        <span>{(variant.total_procedures ?? 0).toLocaleString()} procedimientos tarifados</span>
      </div>
    </div>
  );
}