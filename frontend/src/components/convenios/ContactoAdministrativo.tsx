"use client";

import { User, Phone, Mail } from "lucide-react";
import { SeccionCard } from "@/components/convenios/SeccionCard";
import type { ParsedContact } from "@/lib/parseObservaciones";

const DASH = "—";
const SIN_INFO = "Sin información registrada";

function val(v: string | number | null | undefined): string {
  if (v === null || v === undefined || v === "") return DASH;
  return String(v);
}

interface ContactoAdministrativoProps {
  contacts: ParsedContact[];
}

export function ContactoAdministrativo({ contacts }: ContactoAdministrativoProps) {
  return (
    <SeccionCard icon={<User size={14} className="text-primary" />} titulo="Contacto Administrativo">
      {contacts.length > 0 ? (
        <div className="space-y-3">
          {contacts.map((c, i) => (
            <div key={i} className="space-y-1 text-[12px] text-slate-600 pb-2 border-b border-slate-50 last:border-b-0 last:pb-0">
              <p className="flex items-center gap-1.5">
                <User size={12} className="text-primary/60" />
                {val(c.full_name)} {c.role ? `— ${c.role}` : ""}
              </p>
              <p className="flex items-center gap-1.5">
                <Phone size={12} className="text-primary/60" />
                {val(c.phone)}
              </p>
              <p className="flex items-center gap-1.5">
                <Mail size={12} className="text-primary/60" />
                {val(c.email)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[12px] text-slate-400">{SIN_INFO}</p>
      )}
    </SeccionCard>
  );
}