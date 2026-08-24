"use client";

import { Receipt } from "lucide-react";
import { SeccionCard } from "@/components/convenios/SeccionCard";

const SIN_INFO = "Sin información registrada";

function val(v: string | number | null | undefined): string {
  if (v === null || v === undefined || v === "") return "";
  return String(v);
}

interface RadicacionFacturasProps {
  invoiceFiling: string | null | undefined;
  radicationDocuments: string | null | undefined;
  copaymentCollection: string | null | undefined;
}

export function RadicacionFacturas({
  invoiceFiling,
  radicationDocuments,
  copaymentCollection,
}: RadicacionFacturasProps) {
  return (
    <SeccionCard icon={<Receipt size={14} className="text-primary" />} titulo="Radicación de facturas">
      <p>{val(invoiceFiling)}</p>
      {radicationDocuments && <p className="mt-1 text-slate-500">{radicationDocuments}</p>}
      <p className="mt-1 text-slate-500">{copaymentCollection ? copaymentCollection : SIN_INFO}</p>
    </SeccionCard>
  );
}