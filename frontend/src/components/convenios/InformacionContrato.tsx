"use client";

import { CalendarDays } from "lucide-react";
import { SeccionHeader } from "@/components/convenios/SeccionHeader";

const DASH = "—";

function val(v: string | number | null | undefined): string {
  if (v === null || v === undefined || v === "") return DASH;
  return String(v);
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
    <>
      <SeccionHeader
        icon={<CalendarDays size={13} className="text-slate-400" />}
        titulo="Información del contrato"
        className="mt-3 pt-3 border-t border-slate-50"
      />
      <div className="mt-2 flex flex-wrap gap-4 text-[12px] text-slate-600">
        <span><span className="text-slate-400">Fecha inicio del contrato: </span>{val(startDate)}</span>
        <span><span className="text-slate-400">Último incremento tarifario: </span>{val(lastRateIncrease)}</span>
        <span><span className="text-slate-400">Vencimiento: </span>{val(expirationDate)}</span>
        <span><span className="text-slate-400">Prórroga: </span>{val(autoRenewal)}</span>
      </div>
    </>
  );
}