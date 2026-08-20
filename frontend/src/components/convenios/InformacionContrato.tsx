"use client";

import { CalendarDays } from "lucide-react";
import { SeccionHeader } from "@/components/convenios/SeccionHeader";
import { CampoEditable } from "@/components/convenios/CampoEditable";

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
  hiddenSections: string[];
  isEditing: boolean;
  onToggle: (key: string) => void;
  draftStartDate: string;
  setDraftStartDate: (v: string) => void;
  draftLastRateIncrease: string;
  setDraftLastRateIncrease: (v: string) => void;
  draftExpirationDate: string;
  setDraftExpirationDate: (v: string) => void;
  draftAutoRenewal: string;
  setDraftAutoRenewal: (v: string) => void;
}

const SECTION_KEY = "contrato";

export function InformacionContrato({
  startDate,
  lastRateIncrease,
  expirationDate,
  autoRenewal,
  hiddenSections,
  isEditing,
  onToggle,
  draftStartDate,
  setDraftStartDate,
  draftLastRateIncrease,
  setDraftLastRateIncrease,
  draftExpirationDate,
  setDraftExpirationDate,
  draftAutoRenewal,
  setDraftAutoRenewal,
}: InformacionContratoProps) {
  const isHiddenInEdit = hiddenSections.includes(SECTION_KEY) && isEditing;
  const isHiddenInView = hiddenSections.includes(SECTION_KEY) && !isEditing;

  return (
    <>
      <SeccionHeader
        sectionKey={SECTION_KEY}
        icon={<CalendarDays size={13} className="text-slate-400" />}
        titulo="Información del contrato"
        hiddenSections={hiddenSections}
        isEditing={isEditing}
        onToggle={onToggle}
        className="mt-3 pt-3 border-t border-slate-50"
      />
      {!isHiddenInView && (
        <div className={`mt-2 ${isHiddenInEdit ? "opacity-40" : ""}`}>
          {isEditing ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <CampoEditable label="Fecha inicio del contrato" value={draftStartDate} onChange={setDraftStartDate} />
              <CampoEditable label="Último incremento tarifario" value={draftLastRateIncrease} onChange={setDraftLastRateIncrease} />
              <CampoEditable label="Vencimiento" value={draftExpirationDate} onChange={setDraftExpirationDate} />
              <CampoEditable label="Prórroga" value={draftAutoRenewal} onChange={setDraftAutoRenewal} />
            </div>
          ) : (
            <div className="flex flex-wrap gap-4 text-[12px] text-slate-600">
              <span><span className="text-slate-400">Fecha inicio del contrato: </span>{val(startDate)}</span>
              <span><span className="text-slate-400">Último incremento tarifario: </span>{val(lastRateIncrease)}</span>
              <span><span className="text-slate-400">Vencimiento: </span>{val(expirationDate)}</span>
              <span><span className="text-slate-400">Prórroga: </span>{val(autoRenewal)}</span>
            </div>
          )}
        </div>
      )}
    </>
  );
}