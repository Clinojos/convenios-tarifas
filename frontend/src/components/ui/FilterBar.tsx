"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Filter, ArrowUpDown, Trash2, Search, LucideIcon } from "lucide-react";
import IconButton from "@/components/ui/IconButton";

type TooltipPosition = "right" | "top" | "left" | "bottom";

interface FilterOption { label: string; value: string; }
interface ActiveFilter { label: string; key: string; value: string | null; color: string }

export interface FilterAction {
  key: string;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  colorClass?: string;
  disabled?: boolean;
  tooltipPosition?: TooltipPosition;
}

interface FilterBarProps {
  filters: {
    status?: { value: string; options: FilterOption[] }; 
    category?: { value: string; options: FilterOption[] };
    sortBy?: { value: string; options: FilterOption[] };
  };
  activeFilters?: ActiveFilter[];
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  onFilterChange: (key: string, value: string) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
  actions?: FilterAction[];
}

export function FilterBar({ 
  filters, 
  activeFilters = [], 
  searchQuery, 
  onSearchChange, 
  onFilterChange, 
  onClear, 
  hasActiveFilters,
  actions = [],
}: FilterBarProps) {
  if (!filters) return null;

  return (
    <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between gap-4">
      {/* Contenedor izquierdo: Selectores y Tags */}
      <div className="flex items-center gap-3">
        {filters.status && (
          <div className="flex items-center gap-2 text-[11px] text-primary-dark bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/10 focus-within:border-primary/40 transition-colors">
            <Filter size={14} className="text-primary" />
            <select className="bg-transparent outline-none cursor-pointer" onChange={(e) => onFilterChange("status", e.target.value)} value={filters.status?.value || ""}>
              <option value="">Todos los estados</option>
              {filters.status.options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        )}

        {filters.sortBy && (
          <div className="flex items-center gap-2 text-[11px] text-primary-dark bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/10 focus-within:border-primary/40 transition-colors">
            <ArrowUpDown size={14} className="text-primary" />
            <select className="bg-transparent outline-none cursor-pointer" onChange={(e) => onFilterChange("sort", e.target.value)} value={filters.sortBy?.value || ""}>
              {filters.sortBy.options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        )}

        {activeFilters.map((tag, index) => (
          <div key={`${tag.key}-${tag.value || index}`} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-medium border ${tag.color}`}>
            <span>{tag.label}</span>
            <button onClick={() => onFilterChange(tag.key, "")} className="cursor-pointer font-bold hover:opacity-75 ml-1">✕</button>
          </div>
        ))}
      </div>

      {/* Contenedor derecho: Búsqueda, Acciones y Limpiar */}
      <motion.div 
        layout 
        className="flex items-center gap-3 ml-auto"
      >
        {/* BUSCADOR — ahora primero */}
        {onSearchChange !== undefined && (
          <motion.div 
            layout
            className="flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/10 text-[11px] focus-within:border-primary/40 transition-colors"
          >
            <Search size={14} className="text-primary" />
            <input 
              type="text"
              placeholder="Buscar..."
              value={searchQuery || ""}
              onChange={(e) => onSearchChange(e.target.value)}
              className="bg-transparent outline-none w-32 text-navy placeholder:text-slate-400"
            />
          </motion.div>
        )}

        {/* ACCIONES (crear, eliminar, exportar, etc.) — ahora después del buscador */}
        {actions.length > 0 && (
          <div className="flex items-center gap-1.5 pl-3 border-l border-slate-100">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <IconButton
                  key={action.key}
                  icon={<Icon size={16} />}
                  label={action.label}
                  onClick={action.onClick}
                  tooltipPosition={action.tooltipPosition || "top"}
                  colorClass={
                    action.disabled
                      ? "text-slate-300 pointer-events-none"
                      : action.colorClass || "text-primary hover:bg-primary/10"
                  }
                />
              );
            })}
          </div>
        )}

        {/* Botón Limpiar */}
        <AnimatePresence>
          {hasActiveFilters && (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.5, width: 0 }}
              animate={{ opacity: 1, scale: 1, width: "auto" }}
              exit={{ opacity: 0, scale: 0.5, width: 0 }}
            >
              <IconButton
                icon={<Trash2 size={16} />}
                label="limpiar filtros"
                onClick={onClear}
                tooltipPosition="top"
                colorClass="text-danger hover:bg-danger/10"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}