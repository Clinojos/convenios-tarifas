import { Building2, CheckCircle2, AlertCircle, Hash, FileText } from "lucide-react";
import { Convenio } from "@/types/convenio";
import { ACCENT_COLORS, VARIANT_STYLES } from "./constants";
import { guessVariantLabel } from "./utils";

interface VariantCardProps {
  variant: Convenio;
  accentIndex: number;
  onClick: () => void;
}

export function VariantCard({ variant, accentIndex, onClick }: VariantCardProps) {
  const variantLabel = guessVariantLabel(variant.name);
  const isActive = variant.status === "ACTIVO";

  return (
    <button
      onClick={onClick}
      className="text-left bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col gap-4 hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-150"
    >
      <div className="flex items-start justify-between">
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${ACCENT_COLORS[accentIndex % ACCENT_COLORS.length]}`}
        >
          <Building2 size={26} />
        </div>
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
            isActive ? "bg-green/10 text-green" : "bg-slate-100 text-slate-400"
          }`}
        >
          {isActive ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
          {variant.status}
        </span>
      </div>

      <div>
        <h3 className="text-[15px] font-bold text-navy leading-snug">{variant.name}</h3>
        <span
          className={`mt-1.5 inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
            VARIANT_STYLES[variantLabel.split(" · ")[0]] ?? VARIANT_STYLES.GENERAL
          }`}
        >
          {variantLabel}
        </span>
      </div>

      <div className="mt-auto pt-4 border-t border-slate-50 grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="flex items-center gap-1 text-[9px] uppercase font-bold text-slate-400">
            <Hash size={10} className="text-primary/60" />
            NIT
          </span>
          <span className="text-[12px] font-semibold text-navy truncate">{variant.nit}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="flex items-center gap-1 text-[9px] uppercase font-bold text-slate-400">
            <FileText size={10} className="text-primary/60" />
            Contrato
          </span>
          <span className="text-[12px] font-semibold text-navy truncate">
            {variant.contract_number || "—"}
          </span>
        </div>
      </div>
    </button>
  );
}