import { ArrowLeft, Search } from "lucide-react";
import { Convenio } from "@/types/convenio";
import { RateCard } from "./RateCard";
import { EmptyState } from "./EmptyState";
import { VARIANT_STYLES } from "./constants";
import { guessVariantLabel } from "./utils";
import { MockRate } from "./mock-rates";

interface RatesViewProps {
  activeVariant: Convenio | null;
  fallbackTitle: string | null;
  rates: MockRate[];
  cameFromMultiVariant: boolean;
  backLabel: string;
  onBack: () => void;
}

export function RatesView({
  activeVariant,
  fallbackTitle,
  rates,
  cameFromMultiVariant,
  backLabel,
  onBack,
}: RatesViewProps) {
  const title = activeVariant?.name ?? fallbackTitle;
  const variantLabel = activeVariant ? guessVariantLabel(activeVariant.name) : null;

  return (
    <div className="max-w-[1400px] mx-auto p-4 space-y-4 font-sans flex flex-col h-full">
      <div className="flex flex-col gap-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[12px] text-slate-500 hover:text-primary transition-colors w-fit"
        >
          <ArrowLeft size={14} />
          {cameFromMultiVariant ? `Volver a ${backLabel}` : "Volver a convenios"}
        </button>
        <div className="flex items-center gap-2">
          <h1 className="text-[16px] font-bold text-navy">{title}</h1>
          {variantLabel && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                VARIANT_STYLES[variantLabel.split(" · ")[0]] ?? VARIANT_STYLES.GENERAL
              }`}
            >
              {variantLabel}
            </span>
          )}
        </div>
        <p className="text-[12px] text-slate-500">Tarifario de procedimientos para este convenio</p>

        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-xl text-[12px] text-slate-600 bg-white hover:bg-slate-50 transition-colors">
            <Search size={13} />
            Buscar procedimiento...
          </button>
        </div>
      </div>

      <div className="flex-1">
        {rates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {rates.map((r, i) => (
              <RateCard key={r.code} rate={r} accentIndex={i} variantName={title ?? ""} />
            ))}
          </div>
        ) : (
          <EmptyState
            message="Sin procedimientos de ejemplo cargados para este convenio."
            subMessage={
              <>
                (Pendiente: conectar <code>routes/rates.py</code>)
              </>
            }
          />
        )}
      </div>
    </div>
  );
}