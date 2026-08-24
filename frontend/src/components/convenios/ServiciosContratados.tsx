// components/convenios/ServiciosContratados.tsx
"use client";

import { ClipboardList } from "lucide-react";
import { SeccionCard } from "@/components/convenios/SeccionCard";

const DASH = "Sin informacion registrada";

function val(v: string | number | null | undefined): string {
  if (v === null || v === undefined || v === "") return DASH;
  return String(v);
}

interface ServiciosContratadosProps {
  contractedServices: string | null | undefined;
  hiddenSections: string[];
  isEditing: boolean;
  onToggle: (key: string) => void;
}

const SECTION_KEY = "servicios";

export function ServiciosContratados({
  contractedServices,
  hiddenSections,
  isEditing,
  onToggle,
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
      {val(contractedServices)}
    </SeccionCard>
  );
}