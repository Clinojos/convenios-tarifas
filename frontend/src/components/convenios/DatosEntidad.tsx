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
}

export function DatosEntidad({
  companyNit,
  contractKey,
  address,
  phone,
  habilitationCode,
}: DatosEntidadProps) {
  return (
    <>
      <SeccionHeader icon={<Building2 size={13} className="text-slate-400" />} titulo="Datos de la entidad" />
      <div className="mt-2 pt-3 border-t border-slate-50 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <DatoGeneral label="NIT" value={val(companyNit)} />
        <DatoGeneral label="Numero de Contrato" value={val(contractKey)} />
        <DatoGeneral label="Dirección" value={val(address)} />
        <DatoGeneral label="Teléfono" value={val(phone)} />
        <DatoGeneral label="Cód. Habilitación" value={val(habilitationCode)} />
      </div>
    </>
  );
}