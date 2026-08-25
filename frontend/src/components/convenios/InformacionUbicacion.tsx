"use client";

import { MapPin } from "lucide-react";
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

interface InformacionUbicacionProps {
  direccion: string | number | null | undefined;
  telefono: string | number | null | undefined;
  habilitacion: string | number | null | undefined;
  vencimiento: string | number | null | undefined;
}

export function InformacionUbicacion({
  direccion,
  telefono,
  habilitacion,
  vencimiento,
}: InformacionUbicacionProps) {
  return (
    <SeccionCard
      icon={<MapPin size={14} className="text-primary" />}
      titulo="Ubicación y habilitación"
    >
      <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
        <Field label="Dirección" value={direccion} />
        <Field label="Teléfono" value={telefono} />
        <Field label="Habilitación" value={habilitacion} />
        <Field label="Vencimiento" value={vencimiento} />
      </div>
    </SeccionCard>
  );
}