"use client";

import { Plus, Trash2, User, MapPin, Phone, Mail } from "lucide-react";
import { SeccionCard } from "@/components/convenios/SeccionCard";
import type { AgreementContact } from "@/hooks/useConvenioDetail";

const DASH = "—";
const SIN_INFO = "Sin información registrada";

function val(v: string | number | null | undefined): string {
  if (v === null || v === undefined || v === "") return DASH;
  return String(v);
}

export const EMPTY_CONTACT: AgreementContact = { full_name: "", role: "", address: "", phone: "", email: "" };

interface ContactoAdministrativoProps {
  contacts: AgreementContact[];
  hiddenSections: string[];
  isEditing: boolean;
  onToggle: (key: string) => void;
  draftContacts: AgreementContact[];
  setDraftContacts: (contacts: AgreementContact[]) => void;
}

const SECTION_KEY = "contacto";

export function ContactoAdministrativo({
  contacts,
  hiddenSections,
  isEditing,
  onToggle,
  draftContacts,
  setDraftContacts,
}: ContactoAdministrativoProps) {
  return (
    <SeccionCard
      sectionKey={SECTION_KEY}
      icon={<User size={14} className="text-primary" />}
      titulo="Contacto Administrativo"
      hiddenSections={hiddenSections}
      isEditing={isEditing}
      onToggle={onToggle}
    >
      {isEditing ? (
        <div className="space-y-3">
          {draftContacts.map((c, i) => (
            <div key={i} className="border border-slate-100 rounded-lg p-2 space-y-1.5 relative">
              <button
                type="button"
                onClick={() => setDraftContacts(draftContacts.filter((_, idx) => idx !== i))}
                className="absolute top-1.5 right-1.5 text-slate-400 hover:text-red-500"
              >
                <Trash2 size={12} />
              </button>
              <input
                value={c.full_name ?? ""}
                onChange={(e) => {
                  const copy = [...draftContacts];
                  copy[i] = { ...copy[i], full_name: e.target.value };
                  setDraftContacts(copy);
                }}
                placeholder="Nombre completo"
                className="w-full text-[12px] border border-slate-200 rounded-lg px-2 py-1 outline-none focus:border-primary pr-6"
              />
              <input
                value={c.role ?? ""}
                onChange={(e) => {
                  const copy = [...draftContacts];
                  copy[i] = { ...copy[i], role: e.target.value };
                  setDraftContacts(copy);
                }}
                placeholder="Cargo"
                className="w-full text-[12px] border border-slate-200 rounded-lg px-2 py-1 outline-none focus:border-primary"
              />
              <input
                value={c.address ?? ""}
                onChange={(e) => {
                  const copy = [...draftContacts];
                  copy[i] = { ...copy[i], address: e.target.value };
                  setDraftContacts(copy);
                }}
                placeholder="Dirección"
                className="w-full text-[12px] border border-slate-200 rounded-lg px-2 py-1 outline-none focus:border-primary"
              />
              <input
                value={c.phone ?? ""}
                onChange={(e) => {
                  const copy = [...draftContacts];
                  copy[i] = { ...copy[i], phone: e.target.value };
                  setDraftContacts(copy);
                }}
                placeholder="Teléfono"
                className="w-full text-[12px] border border-slate-200 rounded-lg px-2 py-1 outline-none focus:border-primary"
              />
              <input
                value={c.email ?? ""}
                onChange={(e) => {
                  const copy = [...draftContacts];
                  copy[i] = { ...copy[i], email: e.target.value };
                  setDraftContacts(copy);
                }}
                placeholder="Correo"
                className="w-full text-[12px] border border-slate-200 rounded-lg px-2 py-1 outline-none focus:border-primary"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => setDraftContacts([...draftContacts, { ...EMPTY_CONTACT }])}
            className="text-[11px] text-primary flex items-center gap-1"
          >
            <Plus size={12} /> Agregar contacto
          </button>
        </div>
      ) : contacts.length > 0 ? (
        <div className="space-y-3">
          {contacts.map((c, i) => (
            <div key={i} className="space-y-1 text-[12px] text-slate-600 pb-2 border-b border-slate-50 last:border-b-0 last:pb-0">
              <p className="flex items-center gap-1.5">
                <User size={12} className="text-primary/60" />
                {val(c.full_name)} {c.role ? `— ${c.role}` : ""}
              </p>
              <p className="flex items-center gap-1.5">
                <MapPin size={12} className="text-primary/60" />
                {val(c.address)}
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