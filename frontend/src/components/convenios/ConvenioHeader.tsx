"use client";

/**
 * ConvenioHeader
 * ---------------------------------------------------------------------------
 * Encabezado de la ficha: logo/avatar, nombre, badges de estado
 * (activo/inactivo, cantidad de portafolios, modalidad, EPS) y la acción
 * de edición.
 *
 * CAMBIOS:
 * - Se quitaron los botones "Importar" y "Marcar como pendiente" (no tenían
 *   funcionalidad real).
 * - El botón "Editar" solo se muestra si el usuario tiene el permiso
 *   "agreement:edit" (via usePermissions -> hasPermission). Mientras carga
 *   el permiso, no se muestra nada para evitar el flash del botón.
 * - El badge de portafolio ahora muestra la cantidad real de portafolios
 *   (viene del TarifarioBlock via callback, ver page.tsx) en vez de
 *   "Portafolio cargado" / "Sin portafolio cargado" basado en totalProcedures.
 */

import { Pencil, Check, X } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";

const DASH = "—";

function val(v: string | number | null | undefined): string {
  if (v === null || v === undefined || v === "") return DASH;
  return String(v);
}

interface ConvenioHeaderProps {
  name: string | null | undefined;
  logoUrl?: string | null;
  avatarColor?: string | null;
  status: string | null | undefined;
  isActive: boolean;
  portfolioCount: number;
  modality: string | null | undefined;
  isEps: boolean;
  isEditing: boolean;
  saving: boolean;
  saveError: string | null;
  onStartEditing: () => void;
  onCancelEditing: () => void;
  onSaveEditing: () => void;
}

export function ConvenioHeader({
  name,
  logoUrl,
  avatarColor,
  status,
  isActive,
  portfolioCount,
  modality,
  isEps,
  isEditing,
  saving,
  saveError,
  onStartEditing,
  onCancelEditing,
  onSaveEditing,
}: ConvenioHeaderProps) {
  const { hasPermission, loading: loadingPermissions } = usePermissions();
  const canEdit = hasPermission("agreement:edit");

  const logoInicial = name?.charAt(0).toUpperCase() ?? "?";

  return (
    <>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={name ?? ""}
              className="w-12 h-12 rounded-xl object-cover border border-slate-100 shrink-0"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                e.currentTarget.nextElementSibling?.classList.remove("hidden");
              }}
            />
          ) : null}
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-[16px] shrink-0 ${
              logoUrl ? "hidden" : ""
            }`}
            style={{ backgroundColor: `${avatarColor}20`, color: avatarColor ?? undefined }}
          >
            {logoInicial}
          </div>
          <div>
            <h1 className="text-[16px] font-bold text-navy">{val(name)}</h1>
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
              <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                {val(modality)}
              </span>
              {isEps && (
                <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-purple/10 text-purple">
                  EPS
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Acciones — Editar solo con permiso agreement:edit */}
        <div className="flex items-center gap-2 shrink-0">
          {isEditing ? (
            <>
              <button
                onClick={onCancelEditing}
                disabled={saving}
                className="cursor-pointer inline-flex items-center gap-1.5 text-[12px] font-medium text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <X size={13} />
                Cancelar
              </button>
              <button
                onClick={onSaveEditing}
                disabled={saving}
                className="cursor-pointer inline-flex items-center gap-1.5 text-[12px] font-medium text-white bg-primary rounded-lg px-3 py-1.5 hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Check size={13} />
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </>
          ) : (
            !loadingPermissions &&
            canEdit && (
              <button
                onClick={onStartEditing}
                className="cursor-pointer inline-flex items-center gap-1.5 text-[12px] font-medium text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-colors"
              >
                <Pencil size={13} />
                Editar
              </button>
            )
          )}
        </div>
      </div>

      {saveError && (
        <p className="mt-3 text-[12px] text-red-500 bg-red-50 rounded-lg px-3 py-2">{saveError}</p>
      )}
    </>
  );
}