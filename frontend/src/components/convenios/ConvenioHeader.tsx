"use client";

/**
 * ConvenioHeader
 * ---------------------------------------------------------------------------
 * Encabezado de la ficha: logo/avatar, nombre, código de contrato, badges
 * de estado (activo/inactivo, cantidad de portafolios, EPS) y chip con el
 * nombre de la empresa matriz (grupo al que pertenece el convenio).
 *
 * NUEVO (ago 2026, parte 4):
 * - Se eliminó la edición completa: el convenio se administra directamente
 *   en Hosvital, no desde el SGC. Se quitó el botón "Editar", el permiso
 *   agreement:edit, y los estados saving/saveError.
 *
 * NUEVO (ago 2026, parte 6):
 * - Se agregó companyName: chip junto al nombre con la empresa matriz.
 * - Se quitó el badge de modalidad ("por evento", "capitado", etc.) —
 *   ya no se muestra en el header.
 *
 * NUEVO (ago 2026, parte 7):
 * - Se reincorporó contractKey: código de contrato debajo del nombre
 *   (se había perdido en un refactor anterior).
 *
 * NUEVO (ago 2026, parte 8):
 * - El avatar de respaldo (sin logoUrl) ahora usa el mismo helper
 *   avatarColor(nombre) y la misma forma circular que la página de grupo
 *   (/convenios/grupo/[groupKey]), en vez del color plano que traía el
 *   backend en avatar_color. Así el color de cada empresa es consistente
 *   en toda la app. El prop avatarColor (del backend) queda sin usar aquí;
 *   se puede eliminar de la interfaz cuando ya no se necesite en el padre.
 */

import { Building2, Hash } from "lucide-react";
import { avatarColor as getAvatarColor } from "@/components/convenios/avatarColor";

const DASH = "—";

function val(v: string | number | null | undefined): string {
  if (v === null || v === undefined || v === "") return DASH;
  return String(v);
}

interface ConvenioHeaderProps {
  name: string | null | undefined;
  contractKey?: string | null;
  companyName?: string | null;
  logoUrl?: string | null;
  avatarColor?: string | null;
  status: string | null | undefined;
  isActive: boolean;
  portfolioCount: number;
  isEps: boolean;
}

export function ConvenioHeader({
  name,
  contractKey,
  companyName,
  logoUrl,
  status,
  isActive,
  portfolioCount,
  isEps,
}: ConvenioHeaderProps) {
  const logoInicial = name?.charAt(0).toUpperCase() ?? "?";
  // Mismo criterio que la tarjeta en /convenios/grupo/[groupKey]:
  // empresa matriz si existe, si no el nombre del convenio.
  const avatarBg = getAvatarColor(companyName ?? name ?? "");

  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div className="flex items-start gap-3">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={name ?? ""}
            className="w-12 h-12 rounded-full object-cover border border-slate-100 shrink-0"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              e.currentTarget.nextElementSibling?.classList.remove("hidden");
            }}
          />
        ) : null}
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-[16px] text-white shrink-0 ${avatarBg} ${
            logoUrl ? "hidden" : ""
          }`}
        >
          {logoInicial}
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-[16px] font-bold text-navy">{val(name)}</h1>
            {companyName && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                <Building2 size={11} />
                {companyName}
              </span>
            )}
          </div>

          {contractKey && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
              <Hash size={11} className="text-slate-300" />
              <span className="truncate">{contractKey}</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span
              className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                isActive ? "bg-green/10 text-green" : "bg-slate-100 text-slate-400"
              }`}
            >
              {val(status)}
            </span>
            <span
              className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                portfolioCount > 0 ? "bg-primary/10 text-primary" : "bg-orange/10 text-orange"
              }`}
            >
              {portfolioCount > 0
                ? `${portfolioCount} portafolio${portfolioCount > 1 ? "s" : ""}`
                : "Sin portafolio cargado"}
            </span>
            {isEps && (
              <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-purple/10 text-purple">
                EPS
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}