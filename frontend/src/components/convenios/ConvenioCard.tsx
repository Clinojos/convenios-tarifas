"use client";

import { useState } from "react";
import { FileBarChart, AlertTriangle, ImageOff, Percent, Calendar, FileText, ChevronDown, ChevronUp } from "lucide-react";
import type { ConvenioGroup } from "./types";
import { avatarColor } from "./avatarColor";

interface ConvenioCardProps {
  convenio: ConvenioGroup;
  index: number;
  onOpen: (convenio: ConvenioGroup) => void;
}

function getStatusDot(active: number, total: number) {
  if (total === 0 || active === 0) {
    return { color: "bg-slate-300", label: "Inactivo" };
  }
  if (active === total) {
    return { color: "bg-green", label: "Activo" };
  }
  return { color: "bg-amber-400", label: `${active}/${total} activos` };
}

export function ConvenioCard({ convenio: g, index: i, onOpen }: ConvenioCardProps) {
  const [expanded, setExpanded] = useState(false);
  const esDescuento = g.type === "descuento";
  const sinTarifario = g.tarifario_status === "sin_tarifario";
  const pendienteDigitacion = g.tarifario_status === "pendiente_digitacion";
  const status = getStatusDot(g.active_variants, g.total_variants);

  const matches = g.matched_variant_names ?? [];
  const hasInnerMatch = matches.length > 0;
  const visibleMatches = expanded ? matches : matches.slice(0, 2);
  const extraCount = matches.length - visibleMatches.length;
  const hasExtraContent = hasInnerMatch || sinTarifario || pendienteDigitacion;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(g)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onOpen(g);
      }}
      className="group min-h-[132px] flex flex-col bg-white border border-slate-100 p-4 rounded-2xl hover:border-primary/20 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-[14px] text-white shrink-0 ${avatarColor(
            g.display_name ?? ""
          )}`}
        >
          {g.display_name?.charAt(0).toUpperCase() ?? "?"}
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <h3
            title={g.display_name}
            className="text-[13.5px] font-semibold text-navy leading-snug line-clamp-2 group-hover:text-primary transition-colors"
          >
            {g.display_name}
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5 truncate">
            NIT {g.group_key}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-[11.5px] flex-wrap">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${status.color}`} />
        <span className="text-slate-500 font-medium">{status.label}</span>
        <span className="text-slate-300">·</span>
        <span className="text-slate-400">
          {g.total_variants} convenio{g.total_variants !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Tags de convenios internos que matchearon la búsqueda + alerta de
          tarifario. Ya NO están dentro de un flex-1 con overflow-hidden:
          ahora ocupan el espacio que realmente necesitan, así el texto de
          cada tag nunca se corta, sin importar cuántas líneas ocupe. */}
      {hasExtraContent && (
        <div className="mt-2.5 flex flex-col gap-1.5">
          {hasInnerMatch && (
            <div className="flex flex-wrap items-center gap-1.5">
              {visibleMatches.map((name, idx) => (
                <span
                  key={`${name}-${idx}`}
                  title={name}
                  className="max-w-full flex items-center gap-1.5 text-[11px] font-medium pl-1.5 pr-2.5 py-1 rounded-full bg-primary/5 text-primary-dark border border-primary/10"
                >
                  <FileText size={11} className="text-primary shrink-0" />
                  <span className="truncate">{name}</span>
                </span>
              ))}

              {extraCount > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpanded((v) => !v);
                  }}
                  className="flex items-center gap-0.5 text-[10.5px] font-semibold text-primary hover:text-primary-dark px-2 py-1 rounded-full bg-primary/5 border border-primary/10 hover:border-primary/30 transition-colors shrink-0"
                >
                  +{extraCount}
                </button>
              )}

              {expanded && matches.length > 2 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpanded(false);
                  }}
                  className="flex items-center gap-0.5 text-[10.5px] font-semibold text-slate-400 hover:text-slate-600 px-1"
                >
                  <ChevronUp size={12} />
                </button>
              )}
            </div>
          )}

          {(sinTarifario || pendienteDigitacion) && (
            <div
              className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-lg ${
                sinTarifario ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
              }`}
            >
              {sinTarifario ? <AlertTriangle size={12} className="shrink-0" /> : <ImageOff size={12} className="shrink-0" />}
              <span>{sinTarifario ? "Sin tarifario cargado" : "Pendiente de digitación"}</span>
            </div>
          )}
        </div>
      )}

      {g.vigencia_fin && (
        <div className="mt-auto pt-2.5 flex items-center gap-1.5 text-[11px] text-slate-400 shrink-0">
          <Calendar size={11} className="shrink-0" />
          <span>
            Vence{" "}
            {new Date(g.vigencia_fin).toLocaleDateString("es-CO", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      )}
    </div>
  );
}