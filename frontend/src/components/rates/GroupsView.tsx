"use client";

import { Building2, Hash, IdCard, Stethoscope } from "lucide-react";
import { ConvenioGroup } from "@/hooks/useConvenioGroups";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";

// Mismo ciclo de acentos que en Procedimientos (paleta corporativa de globals.css)
const ACCENT_COLORS = [
  "text-primary bg-primary/10",
  "text-green bg-green/10",
  "text-purple bg-purple/10",
  "text-orange bg-orange/10",
  "text-magenta bg-magenta/10",
];

// Palabras que delatan razón social (empresa) en el nombre
const COMPANY_HINTS = [
  "s.a.s", "sas", "s.a", "ltda", "ltd", "e.u", "eu", "cia", "clinica",
  "clínica", "eps", "ips", "hospital", "corporacion", "corporación",
  "fundacion", "fundación", "asociacion", "asociación", "grupo",
];

function isDoctor(name: string): boolean {
  const n = name.toLowerCase().trim();
  if (!n) return false;
  if (/^(dr|dra)\.?\s/.test(n) || n.startsWith("doctor") || n.startsWith("doctora")) {
    return true;
  }
  return !COMPANY_HINTS.some((hint) => n.includes(hint));
}

interface GroupsViewProps {
  groups: ConvenioGroup[];
  loading: boolean;
  searchInput: string;
  setSearchInput: (value: string) => void;
  statusFilter: "" | "ACTIVO" | "INACTIVO";
  setStatusFilter: (value: "" | "ACTIVO" | "INACTIVO") => void;
  onSelectGroup: (groupKey: string, displayName: string, totalVariants: number) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function GroupsView({
  groups,
  loading,
  searchInput,
  setSearchInput,
  statusFilter,
  setStatusFilter,
  onSelectGroup,
  page,
  totalPages,
  onPageChange,
}: GroupsViewProps) {
  return (
    <div className="max-w-[1400px] mx-auto p-4 space-y-4 font-sans flex flex-col h-full">
      <div className="flex flex-col gap-2">
        <div>
          <h1 className="text-[16px] font-bold text-navy">Convenios / Tarifas</h1>
          <p className="text-[12px] text-slate-500">Catálogo de convenios y grupos de variantes</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Buscar por nombre o NIT..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="border border-slate-100 rounded-xl px-3 py-2 w-full sm:w-72 text-[12px] text-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 shadow-sm"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "" | "ACTIVO" | "INACTIVO")}
            className="border border-slate-100 rounded-xl px-3 py-2 text-[12px] text-navy focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
          >
            <option value="">Todos los estados</option>
            <option value="ACTIVO">Activo</option>
            <option value="INACTIVO">Inactivo</option>
          </select>
        </div>
      </div>

      <div className="flex-1">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm h-[110px] animate-pulse"
              />
            ))}
          </div>
        ) : groups && groups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {groups.map((group, i) => {
              const isActive = group.status === "Activo";
              const nit = group.variant_nits?.[0] || group.group_key;
              const displayName = group.display_name?.trim() || "Sin nombre";
              const hasName = Boolean(group.display_name?.trim());
              const doctor = hasName && isDoctor(displayName);
              const EntityIcon = doctor ? Stethoscope : Building2;

              return (
                <button
                  key={group.group_key}
                  onClick={() =>
                    onSelectGroup(group.group_key, group.display_name, group.total_variants)
                  }
                  className={`relative text-left cursor-pointer border p-5 rounded-2xl shadow-sm flex flex-col hover:shadow-md hover:scale-[1.03] transition-all duration-200 ${
                    isActive
                      ? "bg-white border-slate-100 hover:border-primary/20"
                      : "bg-slate-200/70 border-slate-300"
                  }`}
                >
                  <span
                    className={`absolute top-3 right-3 text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                      isActive ? "text-green bg-green/10" : "text-red bg-red/10"
                    }`}
                  >
                    {group.status}
                  </span>

                  <div className="flex items-start gap-4 pr-16">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isActive
                          ? ACCENT_COLORS[i % ACCENT_COLORS.length]
                          : "text-slate-500 bg-slate-300/60"
                      }`}
                    >
                      <EntityIcon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`text-[13px] font-semibold truncate ${
                          !hasName
                            ? "italic text-slate-400"
                            : isActive
                            ? "text-navy"
                            : "text-slate-600"
                        }`}
                      >
                        {displayName}
                      </h3>
                      <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-500">
                        <IdCard size={12} className="text-primary/60 shrink-0" />
                        <span className="truncate">NIT: {nit}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-300/60 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <Hash size={12} className="text-primary/60" />
                      <span>
                        {group.total_variants}{" "}
                        {group.total_variants === 1 ? "portafolio" : "portafolios"}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="Sin convenios encontrados"
            message="No hay convenios disponibles."
            icon={Building2}
          />
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
    </div>
  );
}