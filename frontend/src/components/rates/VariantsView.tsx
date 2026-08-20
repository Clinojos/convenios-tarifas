import { ArrowLeft } from "lucide-react";
import { Convenio } from "@/types/convenio";
import { VariantCard } from "./VariantCard";
import { LoadingState } from "./LoadingState";

interface VariantsViewProps {
  displayName: string | null;
  variants: Convenio[];
  loading: boolean;
  onBack: () => void;
  onSelectVariant: (nit: string) => void;
}

export function VariantsView({
  displayName,
  variants,
  loading,
  onBack,
  onSelectVariant,
}: VariantsViewProps) {
  return (
    <div className="max-w-[1400px] mx-auto p-4 space-y-4 font-sans flex flex-col h-full">
      <div className="flex flex-col gap-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[12px] text-slate-500 hover:text-primary transition-colors w-fit"
        >
          <ArrowLeft size={14} />
          Volver a convenios
        </button>
        <div>
          <h1 className="text-[18px] font-bold text-navy">{displayName}</h1>
          <p className="text-[12px] text-slate-500">
            {loading
              ? "Cargando portafolios..."
              : `Este convenio tiene ${variants.length} portafolios de tarifas distintos`}
          </p>
        </div>
      </div>

      <div className="flex-1">
        {loading ? (
          <LoadingState message="Cargando variantes..." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {variants.map((v, i) => (
              <VariantCard
                key={v.nit}
                variant={v}
                accentIndex={i}
                onClick={() => onSelectVariant(v.nit)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}