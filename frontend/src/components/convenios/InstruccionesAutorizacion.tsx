"use client";

import { ShieldCheck } from "lucide-react";
import { SeccionCard } from "@/components/convenios/SeccionCard";

const SIN_INFO = "Sin información registrada";

interface InstruccionesAutorizacionProps {
  authorizationInstructions: string | null | undefined;
  hiddenSections: string[];
  isEditing: boolean;
  onToggle: (key: string) => void;
  draftAuthorizationInstructions: string;
  setDraftAuthorizationInstructions: (v: string) => void;
}

const SECTION_KEY = "autorizacion";

export function InstruccionesAutorizacion({
  authorizationInstructions,
  hiddenSections,
  isEditing,
  onToggle,
  draftAuthorizationInstructions,
  setDraftAuthorizationInstructions,
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
      {isEditing ? (
        <textarea
          value={draftAuthorizationInstructions}
          onChange={(e) => setDraftAuthorizationInstructions(e.target.value)}
          rows={4}
          className="w-full text-[12px] border border-slate-200 rounded-lg p-2 outline-none focus:border-primary resize-none"
          placeholder="Instrucciones de autorización por escenario..."
        />
      ) : (
        <p className="text-[12px]">
          {authorizationInstructions ? authorizationInstructions : (
            <span className="text-slate-400">{SIN_INFO}</span>
          )}
        </p>
      )}
    </SeccionCard>
  );
}