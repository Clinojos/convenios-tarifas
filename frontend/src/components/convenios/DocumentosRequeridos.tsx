"use client";

import { FileText, Plus, Trash2 } from "lucide-react";
import { SeccionCard } from "@/components/convenios/SeccionCard";

const SIN_INFO = "Sin información registrada";

interface RequiredDocument {
  order: number;
  description: string;
}

interface DocumentosRequeridosProps {
  requiredDocuments: RequiredDocument[];
  hiddenSections: string[];
  isEditing: boolean;
  onToggle: (key: string) => void;
  draftDocuments: string[];
  setDraftDocuments: (docs: string[]) => void;
}

const SECTION_KEY = "documentos";

export function DocumentosRequeridos({
  requiredDocuments,
  hiddenSections,
  isEditing,
  onToggle,
  draftDocuments,
  setDraftDocuments,
}: DocumentosRequeridosProps) {
  return (
    <SeccionCard
      sectionKey={SECTION_KEY}
      icon={<FileText size={14} className="text-primary" />}
      titulo="Documentos requeridos para la atención"
      hiddenSections={hiddenSections}
      isEditing={isEditing}
      onToggle={onToggle}
    >
      {isEditing ? (
        <div className="space-y-1.5">
          {draftDocuments.map((doc, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <input
                value={doc}
                onChange={(e) => {
                  const copy = [...draftDocuments];
                  copy[i] = e.target.value;
                  setDraftDocuments(copy);
                }}
                placeholder="Documento requerido"
                className="flex-1 text-[12px] border border-slate-200 rounded-lg px-2 py-1 outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setDraftDocuments(draftDocuments.filter((_, idx) => idx !== i))}
                className="text-slate-400 hover:text-red-500 shrink-0"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setDraftDocuments([...draftDocuments, ""])}
            className="text-[11px] text-primary flex items-center gap-1 mt-1"
          >
            <Plus size={12} /> Agregar documento
          </button>
        </div>
      ) : requiredDocuments.length > 0 ? (
        <ul className="space-y-1">
          {requiredDocuments.map((d) => (
            <li key={d.order}>• {d.description}</li>
          ))}
        </ul>
      ) : (
        SIN_INFO
      )}
    </SeccionCard>
  );
}