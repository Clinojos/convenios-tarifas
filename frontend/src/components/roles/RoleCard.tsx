"use client";

import { useState } from "react";
import { ShieldCheck, Pencil, Trash2 } from "lucide-react";
import { getRoleColor } from "./roleColors";
import { ConfirmModal } from "@/components/ui/confirm-modal";

interface RoleCardProps {
  role: any;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (role: any) => void;
  onDelete: (id: string) => void;
}

export default function RoleCard({ role, canEdit, canDelete, onEdit, onDelete }: RoleCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const c = getRoleColor(role.name);

  return (
    // Agregamos h-48 para una altura constante. Cambia 48 por el número que prefieras (ej: h-56)
    <div className="group relative bg-white border border-slate-100 rounded-2xl p-5 flex flex-col h-48 hover:border-slate-200 hover:shadow-sm transition-all duration-200 font-sans">
      
      {/* Cabecera */}
      <div className="flex items-start justify-between gap-2 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/10 flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={16} className="text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-navy truncate">{role.name}</h3>
            <span className={`inline-block mt-0.5 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ring-1 ${c.badge}`}>
              Rol
            </span>
          </div>
        </div>
        
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          {canEdit && (
            <button
              onClick={() => onEdit(role)}
              className="cursor-pointer p-1.5 rounded-lg text-slate-400 hover:text-navy hover:bg-primary/10 transition-colors"
            >
              <Pencil size={13} />
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => setShowConfirm(true)}
              className="cursor-pointer p-1.5 rounded-lg text-slate-400 hover:text-danger hover:bg-danger/10 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Descripción: flex-1 permite que ocupe el espacio restante. line-clamp-4 corta el texto si es muy largo */}
      <p className="text-sm text-slate-500 leading-relaxed mt-4 flex-1 overflow-hidden line-clamp-4">
        {role.description || <span className="italic text-slate-300">Sin descripción</span>}
      </p>

      <ConfirmModal 
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={() => {
          onDelete(role.id);
          setShowConfirm(false);
        }}
        title="¿Eliminar rol?"
        description={`¿Estás seguro de que deseas eliminar el rol "${role.name}"?`}
      />
    </div>
  );
}