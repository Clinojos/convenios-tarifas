import { Building2, Layers, Hash } from "lucide-react";
import { ConvenioGroup } from "@/hooks/useConvenioGroups";
import { ACCENT_COLORS } from "./constants";

interface GroupCardProps {
  group: ConvenioGroup;
  accentIndex: number;
  onClick: () => void;
}

const KEEP_UPPERCASE = new Set([
  "NIT", "IPS", "SAS", "EPS", "SOAT", "ADRES", "IVA", "SA", "LTDA",
  "ESE", "IPS-SAS", "UT", "S.A.S", "S.A", "ARL", "SGSSS",
]);

function formatDisplayName(raw: string): string {
  if (!raw?.trim()) return "";

  return raw
    .split(" ")
    .map((word) => {
      const clean = word.replace(/[().,]/g, "");
      if (KEEP_UPPERCASE.has(clean.toUpperCase()) || /\d/.test(word)) {
        return word;
      }
      const lower = word.toLowerCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

export function GroupCard({ group, accentIndex, onClick }: GroupCardProps) {
  const isActive = group.status?.trim().toUpperCase() === "ACTIVO";
  const formattedName = formatDisplayName(group.display_name);
  const hasName = !!formattedName;
  const title = hasName ? formattedName : "Sin nombre";

  // Fondo/borde de la card según combinación de estado + nombre
  let cardStyles: string;
  if (hasName && isActive) {
    cardStyles = "bg-white border border-slate-100 hover:border-primary/20";
  } else if (hasName && !isActive) {
    cardStyles = "bg-slate-50 border border-slate-200 hover:border-slate-300";
  } else if (!hasName && isActive) {
    cardStyles = "bg-amber-50/60 border border-dashed border-amber-200 hover:border-amber-300";
  } else {
    cardStyles = "bg-rose-50/60 border border-dashed border-rose-200 hover:border-rose-300";
  }

  // Estilos del título según si tiene nombre o no
  const titleStyles = hasName ? "text-navy" : "text-amber-700 italic font-medium";

  // Estilos del footer (línea de portafolios/NIT)
  let footerBorder: string;
  let footerText: string;
  let iconColor: string;
  if (!hasName && isActive) {
    footerBorder = "border-amber-100";
    footerText = "text-amber-600";
    iconColor = "text-amber-400";
  } else if (!hasName && !isActive) {
    footerBorder = "border-rose-100";
    footerText = "text-rose-600";
    iconColor = "text-rose-400";
  } else {
    footerBorder = "border-slate-50";
    footerText = "text-slate-500";
    iconColor = "text-primary/50";
  }

  return (
    <button
      onClick={onClick}
      className={`cursor-pointer text-left p-4 rounded-2xl shadow-sm flex flex-col gap-3 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-150 ${cardStyles}`}
    >
      <div className="flex items-center justify-between">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${ACCENT_COLORS[accentIndex % ACCENT_COLORS.length]}`}
        >
          <Building2 size={18} />
        </div>

        <span
          className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${
            isActive ? "text-green" : "text-slate-400"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-green" : "bg-slate-300"}`}
          />
          {isActive ? "Activo" : "Inactivo"}
        </span>
      </div>

      <h3
        className={`text-[14px] font-semibold leading-snug line-clamp-2 ${titleStyles}`}
      >
        {title}
      </h3>

      <div
        className={`mt-auto pt-3 border-t flex items-center gap-1.5 text-[12px] ${footerBorder} ${footerText}`}
      >
        {group.total_variants > 1 ? (
          <>
            <Layers size={13} className={iconColor} />
            <span>{group.total_variants} portafolios</span>
          </>
        ) : (
          <>
            <Hash size={13} className={iconColor} />
            <span>NIT: {group.variant_nits[0]}</span>
          </>
        )}
      </div>
    </button>
  );
}