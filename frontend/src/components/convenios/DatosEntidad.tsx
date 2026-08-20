"use client";

import { Building2 } from "lucide-react";
import { SeccionHeader } from "@/components/convenios/SeccionHeader";
import { DatoGeneral } from "@/components/convenios/DatoGeneral";

const DASH = "—";

function val(v: string | number | null | undefined): string {
  if (v === null || v === undefined || v === "") return DASH;
  return String(v);
}

interface DatosEntidadProps {
  companyNit: string | number | null | undefined;
  contractKey: string | number | null | undefined;
  address: string | number | null | undefined;
  phone: string | number | null | undefined;
  habilitationCode: string | number | null | undefined;
  hiddenSections: string[];
  isEditing: boolean;
  onToggle: (key: string) => void;
  draftAddress: string;
  setDraftAddress: (v: string) => void;
  draftPhone: string;
  setDraftPhone: (v: string) => void;
  draftHabilitationCode: string;
  setDraftHabilitationCode: (v: string) => void;
}

const SECTION_KEY = "entidad";

export function DatosEntidad({
  companyNit,
  contractKey,
  address,
  phone,
  habilitationCode,
  hiddenSections,
  isEditing,
  onToggle,
  draftAddress,
  setDraftAddress,
  draftPhone,
  setDraftPhone,
  draftHabilitationCode,
  setDraftHabilitationCode,
}: DatosEntidadProps) {
  const isHiddenInEdit = hiddenSections.includes(SECTION_KEY) && isEditing;
  const isHiddenInView = hiddenSections.includes(SECTION_KEY) && !isEditing;

  return (
    <>
      <SeccionHeader
        sectionKey={SECTION_KEY}
        icon={<Building2 size={13} className="text-slate-400" />}
        titulo="Datos de la entidad"
        hiddenSections={hiddenSections}
        isEditing={isEditing}
        onToggle={onToggle}
      />
      {!isHiddenInView && (
        <div
          className={`mt-2 pt-3 border-t border-slate-50 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 ${
            isHiddenInEdit ? "opacity-40" : ""
          }`}
        >
          <DatoGeneral label="NIT" value={val(companyNit)} />
          <DatoGeneral label="Numero de Contrato" value={val(contractKey)} />
          <DatoGeneral
            label="Dirección"
            value={val(address)}
            isEditing={isEditing}
            draftValue={draftAddress}
            onChange={setDraftAddress}
          />
          <DatoGeneral
            label="Teléfono"
            value={val(phone)}
            isEditing={isEditing}
            draftValue={draftPhone}
            onChange={setDraftPhone}
          />
          <DatoGeneral
            label="Cód. Habilitación"
            value={val(habilitationCode)}
            isEditing={isEditing}
            draftValue={draftHabilitationCode}
            onChange={setDraftHabilitationCode}
          />
        </div>
      )}
    </>
  );
}