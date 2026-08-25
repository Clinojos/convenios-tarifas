"use client";

import { CalendarDays } from "lucide-react";
import { SeccionCard } from "@/components/convenios/SeccionCard";

const DASH = "—";

function val(v: string | number | null | undefined): string {
  if (v === null || v === undefined || v === "") return DASH;
  return String(v);
}

function Field({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="min-w-0">
      <p className="text-slate-500 leading-tight mb-0.5">{label}: </p>
      <p className="text-slate-700 break-words leading-snug">{val(value)}</p>
    </div>
  );
}

interface InformacionContratoProps {
  startDate: string | number | null | undefined;
  lastRateIncrease: string | number | null | undefined;
  expirationDate: string | number | null | undefined;
  autoRenewal: string | number | null | undefined;
}

export function InformacionContrato({
  startDate,
  lastRateIncrease,
  expirationDate,
  autoRenewal,
}: InformacionContratoProps) {
  return (
    <SeccionCard
      icon={<CalendarDays size={14} className="text-primary" />}
      titulo="Información del contrato"
    >
      <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
        <Field label="Fecha inicio del contrato" value={startDate} />
        <Field label="Último incremento tarifario" value={lastRateIncrease} />
        <Field label="Vencimiento" value={expirationDate} />
        <Field label="Prórroga" value={autoRenewal} />
      </div>
    </SeccionCard>
  );
}