"use client";

import { Hash, FileBarChart, AlertTriangle, ImageOff, Percent, Calendar, Layers } from "lucide-react";
import { ACCENT_COLORS } from "./constants";
import type { ConvenioGroup } from "./types";

interface ConvenioCardProps {
  convenio: ConvenioGroup;
  index: number;
  onOpen: (convenio: ConvenioGroup) => void;
}

function getStatusBadge(active: number, total: number) {
  if (total === 0 || active === 0) {
    return { label: "Inactivo", className: "bg-slate-100 text-slate-400" };
  }
  if (active === total) {
    return { label: "Activo", className: "bg-green/10 text-green" };
  }
  return { label: `${active}/${total} activos`, className: "bg-amber-50 text-amber-600" };
}

export function ConvenioCard({ convenio: g, index: i, onOpen }: ConvenioCardProps) {
  const esDescuento = g.type === "descuento";
  const sinTarifario = g.tarifario_status === "sin_tarifario";
  const pendienteDigitacion = g.tarifario_status === "pendiente_digitacion";
  const statusBadge = getStatusBadge(g.active_variants, g.total_variants);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(g)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onOpen(g);
      }}
      className="h-full flex flex-col bg-white border border-slate-100 p-4 rounded-2xl hover:border-primary/20 hover:shadow-sm transition-all cursor-pointer"
    >
      <div className="flex items-start gap-3">
        {g.logo_url ? (
          <img
            src={g.logo_url}
            alt={g.display_name}
            className="w-11 h-11 rounded-lg object-cover border border-slate-100 shrink-0"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              e.currentTarget.nextElementSibling?.classList.remove("hidden");
            }}
          />
        ) : null}
        <div
          className={`w-11 h-11 rounded-lg flex items-center justify-center font-bold text-[15px] shrink-0 ${
            g.logo_url ? "hidden" : ""
          } ${ACCENT_COLORS[i % ACCENT_COLORS.length]}`}
        >
          {g.display_name?.charAt(0).toUpperCase() ?? "?"}
        </div>
        <div className="flex-1 min-w-0">
          <h3
            title={g.display_name}
            className="text-[13px] font-semibold text-navy leading-snug line-clamp-2"
          >
            {g.display_name}
          </h3>
          <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
            <Hash size={10} className="text-primary/50 shrink-0" />
            <span className="truncate">NIT: {g.group_key}</span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5 flex-wrap">
        {/* Primero: cuántos convenios hay */}
        <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-primary/10 text-primary flex items-center gap-1">
          <Layers size={10} />
          {g.total_variants} convenio{g.total_variants !== 1 ? "s" : ""}
        </span>

        {/* Después: estado de activos, solo si aporta info (parcial o inactivo) */}
        {statusBadge.label !== "Activo" && (
          <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${statusBadge.className}`}>
            {statusBadge.label}
          </span>
        )}

        {g.type && (
          <span
            className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
              esDescuento ? "bg-purple-50 text-purple-600" : "bg-blue-50 text-blue-600"
            }`}
          >
            {esDescuento ? "Descuento" : "Tarifario propio"}
          </span>
        )}
      </div>

      {(sinTarifario || pendienteDigitacion) && (
        <div
          className={`mt-2 flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-lg ${
            sinTarifario ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
          }`}
        >
          {sinTarifario ? <AlertTriangle size={12} /> : <ImageOff size={12} />}
          <span>{sinTarifario ? "Sin tarifario cargado" : "Pendiente de digitación (solo imagen)"}</span>
        </div>
      )}

      {g.vigencia_fin && (
        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
          <Calendar size={11} className="text-primary/40 shrink-0" />
          <span>Vence: {new Date(g.vigencia_fin).toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "numeric" })}</span>
        </div>
      )}

      {/* Empuja el footer al fondo para que todas las tarjetas queden alineadas */}
      <div className="mt-auto pt-3 border-t border-slate-50 flex items-center gap-1.5 text-[11px] text-slate-500">
        {esDescuento ? (
          <>
            <Percent size={12} className="text-primary/50 shrink-0" />
            <span>
              {g.descuento_porcentaje != null ? `${g.descuento_porcentaje}% dto.` : "Descuento"}
              {g.descuento_aplica_sobre ? ` sobre ${g.descuento_aplica_sobre}` : ""}
            </span>
          </>
        ) : (
          <>
            <FileBarChart size={12} className="text-primary/50 shrink-0" />
            <span>{(g.total_procedures ?? 0).toLocaleString()} procedimientos tarifados</span>
          </>
        )}
      </div>
    </div>
  );
}