"use client";

import { FileBarChart, AlertTriangle, ImageOff, Percent, Calendar } from "lucide-react";
import type { ConvenioGroup } from "./types";

interface ConvenioCardProps {
  convenio: ConvenioGroup;
  index: number;
  onOpen: (convenio: ConvenioGroup) => void;
}

// Misma paleta/hash que usa el dashboard (avatarColor en page.tsx) para que
// el color de cada convenio sea consistente entre el inicio y la lista.
const AVATAR_PALETTE = ["bg-primary", "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-purple-500"];
function avatarColor(nombre: string) {
  const hash = [...nombre].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

// Un solo indicador de estado en vez de dos pastillas separadas
// (antes: "N convenios" + "activo/inactivo" compitiendo por atención).
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
  const esDescuento = g.type === "descuento";
  const sinTarifario = g.tarifario_status === "sin_tarifario";
  const pendienteDigitacion = g.tarifario_status === "pendiente_digitacion";
  const status = getStatusDot(g.active_variants, g.total_variants);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(g)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onOpen(g);
      }}
      className="group h-full flex flex-col bg-white border border-slate-100 p-4 rounded-2xl hover:border-primary/20 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
    >
      {/* Header: avatar de iniciales + nombre + NIT (sin imágenes/logos) */}
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

      {/* Línea de estado: un solo elemento, escaneable de un vistazo */}
      <div className="mt-3 flex items-center gap-2 text-[11.5px] flex-wrap">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${status.color}`} />
        <span className="text-slate-500 font-medium">{status.label}</span>
        <span className="text-slate-300">·</span>
        <span className="text-slate-400">
          {g.total_variants} convenio{g.total_variants !== 1 ? "s" : ""}
        </span>
        <span className="text-slate-300">·</span>
        <span className={`font-medium ${esDescuento ? "text-purple-500" : "text-blue-500"}`}>
          {esDescuento ? "Descuento" : "Tarifario propio"}
        </span>
      </div>

      {/* Aviso — solo aparece cuando hay un problema real que resolver */}
      {(sinTarifario || pendienteDigitacion) && (
        <div
          className={`mt-2.5 flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-lg ${
            sinTarifario ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
          }`}
        >
          {sinTarifario ? <AlertTriangle size={12} className="shrink-0" /> : <ImageOff size={12} className="shrink-0" />}
          <span>{sinTarifario ? "Sin tarifario cargado" : "Pendiente de digitación"}</span>
        </div>
      )}

      {/* Vigencia — dato secundario, discreto */}
      {g.vigencia_fin && (
        <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-400">
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

      {/* Footer: el dato más importante para decidir con qué convenio trabajar */}
      <div className="mt-auto pt-3 border-t border-slate-50 flex items-center gap-1.5 text-[12px] text-slate-600 font-medium">
        {esDescuento ? (
          <>
            <Percent size={13} className="text-primary/60 shrink-0" />
            <span>
              {g.descuento_porcentaje != null ? `${g.descuento_porcentaje}% dto.` : "Descuento"}
              {g.descuento_aplica_sobre ? ` sobre ${g.descuento_aplica_sobre}` : ""}
            </span>
          </>
        ) : (
          <>
            <FileBarChart size={13} className="text-primary/60 shrink-0" />
            <span>{(g.total_procedures ?? 0).toLocaleString()} procedimientos tarifados</span>
          </>
        )}
      </div>
    </div>
  );
}