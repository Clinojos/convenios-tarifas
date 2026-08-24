"use client";

import { FileText } from "lucide-react";
import { SeccionCard } from "@/components/convenios/SeccionCard";

const SIN_INFO = "Sin información registrada";

interface DocumentosRequeridosProps {
  requiredDocuments: string[];
}

export function DocumentosRequeridos({ requiredDocuments }: DocumentosRequeridosProps) {
  return (
    <SeccionCard icon={<FileText size={14} className="text-primary" />} titulo="Documentos requeridos para la atención">
      {requiredDocuments.length > 0 ? (
        <ul className="space-y-1">
          {requiredDocuments.map((doc, i) => (
            <li key={i}>• {doc}</li>
          ))}
        </ul>
      ) : (
        SIN_INFO
      )}
    </SeccionCard>
  );
}