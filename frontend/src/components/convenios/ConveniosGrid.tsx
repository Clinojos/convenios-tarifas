"use client";

import { Building2 } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConvenioCard } from "./ConvenioCard";
import type { ConvenioGroup } from "./types";

interface ConveniosGridProps {
  convenios: ConvenioGroup[];
  onOpen: (convenio: ConvenioGroup) => void;
  loading?: boolean;
}

function ConvenioCardSkeleton() {
  return (
    <div className="h-full flex flex-col bg-white border border-slate-100 p-4 rounded-2xl animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-200 shrink-0" />
        <div className="flex-1 min-w-0 pt-0.5 space-y-2">
          <div className="h-3 w-3/4 bg-slate-200 rounded" />
          <div className="h-2.5 w-1/3 bg-slate-200 rounded" />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <div className="h-2.5 w-16 bg-slate-200 rounded-full" />
        <div className="h-2.5 w-20 bg-slate-200 rounded" />
      </div>
      <div className="mt-auto pt-3 border-t border-slate-50">
        <div className="h-3 w-2/3 bg-slate-200 rounded" />
      </div>
    </div>
  );
}

export function ConveniosGrid({ convenios, onOpen, loading }: ConveniosGridProps) {
  // Mientras carga (initial fetch o cambio de página/filtro), solo se
  // reemplazan las tarjetas por skeletons. El resto de la página (barra
  // de filtros, paginación) sigue montado y en su sitio.
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <ConvenioCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!convenios || convenios.length === 0) {
    return <EmptyState title="Sin convenios encontrados" message="No hay convenios disponibles." icon={Building2} />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {convenios.map((g, i) => (
        <ConvenioCard key={g.group_key} convenio={g} index={i} onOpen={onOpen} />
      ))}
    </div>
  );
}