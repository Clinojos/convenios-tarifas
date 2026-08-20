import { DollarSign, Building2, AlertCircle, CheckCircle2, Hash } from "lucide-react";
import { ACCENT_COLORS } from "./constants";
import { formatCOP } from "./utils";
import { MockRate } from "./mock-rates";

interface RateCardProps {
  rate: MockRate;
  accentIndex: number;
  variantName: string;
}

export function RateCard({ rate, accentIndex, variantName }: RateCardProps) {
  return (
    <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm flex flex-col hover:shadow-md hover:border-primary/20 transition-all">
      <div className="flex items-start gap-4">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${ACCENT_COLORS[accentIndex % ACCENT_COLORS.length]}`}
        >
          <DollarSign size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[13px] font-semibold text-navy truncate">{rate.procedure}</h3>
          <div className="flex items-center gap-1 mt-0.5 text-[11px] text-slate-500">
            <Building2 size={11} />
            <span className="truncate">{variantName}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-50 text-[11px] text-slate-600 space-y-1.5">
        <p className="flex items-center justify-between">
          <span className="text-slate-400 uppercase font-bold text-[10px]">Tarifa</span>
          <span className="text-navy font-medium">{rate.rate}</span>
        </p>
        <p className="flex items-center justify-between">
          <span className="text-slate-400 uppercase font-bold text-[10px]">Autorización</span>
          {rate.reqAuth ? (
            <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
              <AlertCircle size={12} /> Requerida
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-green font-medium">
              <CheckCircle2 size={12} /> No requerida
            </span>
          )}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-50">
        <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Valor</p>
        <p className="text-xl font-bold text-navy">{formatCOP(rate.price)}</p>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <Hash size={12} className="text-primary/60" />
          <span>Cód: {rate.code}</span>
        </div>
      </div>
    </div>
  );
}