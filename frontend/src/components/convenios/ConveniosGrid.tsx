"use client";

import { Building2 } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConvenioCard } from "./ConvenioCard";
import type { ConvenioGroup } from "./types";

interface ConveniosGridProps {
  convenios: ConvenioGroup[];
  onOpen: (convenio: ConvenioGroup) => void;   // antes: (groupKey: string) => void
}

export function ConveniosGrid({ convenios, onOpen }: ConveniosGridProps) {
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