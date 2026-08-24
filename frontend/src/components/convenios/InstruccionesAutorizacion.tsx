// components/convenios/InstruccionesAutorizacion.tsx
"use client";

import { ShieldCheck } from "lucide-react";
import { SeccionCard } from "@/components/convenios/SeccionCard";

const SIN_INFO = "Sin información registrada";

interface InstruccionesAutorizacionProps {
  authorizationInstructions: string | null | undefined;
  hiddenSections: string[];
  isEditing: boolean;
  onToggle: (key: string) => void;
}

const SECTION_KEY = "autorizacion";

export function InstruccionesAutorizacion({
  authorizationInstructions,
  hiddenSections,
  isEditing,
  onToggle,
}: InstruccionesAutorizacionProps) {
  return (
    <SeccionCard
      sectionKey={SECTION_KEY}
      icon={<ShieldCheck size={14} className="text-primary" />}
      titulo="Instrucciones de Autorización"
      hiddenSections={hiddenSections}
      isEditing={isEditing}
      onToggle={onToggle}
    >
      <p className="text-[12px]">
        {authorizationInstructions ? authorizationInstructions : (
          <span className="text-slate-400">{SIN_INFO}</span>
        )}
      </p>
    </SeccionCard>
  );
}