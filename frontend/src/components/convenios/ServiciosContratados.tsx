"use client";

import { ClipboardList } from "lucide-react";
import { SeccionCard } from "@/components/convenios/SeccionCard";

const DASH = "—";

function val(v: string | number | null | undefined): string {
  if (v === null || v === undefined || v === "") return DASH;
  return String(v);
}

interface ServiciosContratadosProps {
  contractedServices: string | null | undefined;
  hiddenSections: string[];
  isEditing: boolean;
  onToggle: (key: string) => void;
  draftServices: string;
  setDraftServices: (v: string) => void;
}

const SECTION_KEY = "servicios";

export function ServiciosContratados({
  contractedServices,
  hiddenSections,
  isEditing,
  onToggle,
  draftServices,
  setDraftServices,
}: ServiciosContratadosProps) {
  return (
    <SeccionCard
      sectionKey={SECTION_KEY}
      icon={<ClipboardList size={14} className="text-primary" />}
      titulo="Servicios contratados"
      hiddenSections={hiddenSections}
      isEditing={isEditing}
      onToggle={onToggle}
    >
      {isEditing ? (
        <textarea
          value={draftServices}
          onChange={(e) => setDraftServices(e.target.value)}
          rows={4}
          className="w-full text-[12px] border border-slate-200 rounded-lg p-2 outline-none focus:border-primary resize-none"
          placeholder="Describí los servicios contratados..."
        />
      ) : (
        val(contractedServices)
      )}
    </SeccionCard>
  );
}