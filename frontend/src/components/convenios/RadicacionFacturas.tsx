"use client";

import { Receipt } from "lucide-react";
import { SeccionCard } from "@/components/convenios/SeccionCard";

const SIN_INFO = "Sin información registrada";

function val(v: string | number | null | undefined): string {
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
}

interface RadicacionFacturasProps {
  invoiceFiling: string | null | undefined;
  radicationDocuments: string | null | undefined;
  copaymentCollection: string | null | undefined;
  hiddenSections: string[];
  isEditing: boolean;
  onToggle: (key: string) => void;
  draftInvoiceFiling: string;
  setDraftInvoiceFiling: (v: string) => void;
  draftRadicationDocuments: string;
  setDraftRadicationDocuments: (v: string) => void;
  draftCopayment: string;
  setDraftCopayment: (v: string) => void;
}

const SECTION_KEY = "facturacion";

export function RadicacionFacturas({
  invoiceFiling,
  radicationDocuments,
  copaymentCollection,
  hiddenSections,
  isEditing,
  onToggle,
  draftInvoiceFiling,
  setDraftInvoiceFiling,
  draftRadicationDocuments,
  setDraftRadicationDocuments,
  draftCopayment,
  setDraftCopayment,
}: RadicacionFacturasProps) {
  return (
    <SeccionCard
      sectionKey={SECTION_KEY}
      icon={<Receipt size={14} className="text-primary" />}
      titulo="Radicación de facturas"
      hiddenSections={hiddenSections}
      isEditing={isEditing}
      onToggle={onToggle}
    >
      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={draftInvoiceFiling}
            onChange={(e) => setDraftInvoiceFiling(e.target.value)}
            rows={2}
            className="w-full text-[12px] border border-slate-200 rounded-lg p-2 outline-none focus:border-primary resize-none"
            placeholder="..."
          />
        </div>
      ) : (
        <>
          <p>{val(invoiceFiling)}</p>
          {radicationDocuments && (
            <p className="mt-1 text-slate-500">{radicationDocuments}</p>
          )}
          <p className="mt-1 text-slate-500">
            {copaymentCollection ? copaymentCollection : SIN_INFO}
          </p>
        </>
      )}
    </SeccionCard>
  );
}