"use client";

import { useState } from "react";
import { Check, ChevronRight, X } from "lucide-react";
import { getRoleColor } from "../roles/roleColors";
import { ConfirmModal } from "@/components/ui/confirm-modal";

interface AssignRoleModalProps {
  user: any;
  roles: any[];
  onAssign: (userId: string, roleId: string) => Promise<void>;
  onRemove: (userId: string) => Promise<void>;
  onClose: () => void;
}

export default function AssignRoleModal({ user, roles, onAssign, onRemove, onClose }: AssignRoleModalProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="space-y-5 font-sans">
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100">
        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-xs font-bold uppercase">
          {String(user.user_id || user.id).slice(0, 2)}
        </div>
        <div>
          <p className="text-[10px] font-medium opacity-80 uppercase text-navy">
            {user.role ? "Usuario con rol activo" : "Usuario pendiente"}
          </p>
          <p className="text-lg font-bold mt-0.5 truncate max-w-[220px] text-navy">{user.name || user.id}</p>
        </div>

        {/* Sección del Rol Actual con opción de quitar */}
        {user.role && (
          <div className="ml-auto flex items-center gap-2">
            <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-lg ring-1 ${getRoleColor(user.role.name).badge}`}>
              {user.role.name}
            </span>
            <button
              onClick={() => setShowConfirm(true)}
              className="cursor-pointer p-1 hover:bg-danger/10 text-danger/60 hover:text-danger rounded-full transition-colors"
              title="Quitar rol"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* MODAL DE CONFIRMACIÓN INTEGRADO */}
        <ConfirmModal
          isOpen={showConfirm}
          onClose={() => setShowConfirm(false)}
          onConfirm={async () => {
            setLoading("removing");
            await onRemove(user.id || user.user_id);
            onClose();
          }}
          title="¿Quitar rol?"
          description={`¿Estás seguro de que deseas quitar el rol de "${user.role?.name}" a ${user.id}?`}
        />
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-medium opacity-80 uppercase px-1 text-navy">Selecciona un rol</p>
        {roles.map((r: any) => {
          const c = getRoleColor(r.name);
          const isActive = user.role?.id === r.id;
          return (
            <button
              key={r.id}
              disabled={!!loading}
              onClick={async () => {
                setLoading(r.id);
                await onAssign(user.id || user.user_id, r.id);
                onClose();
              }}
              className={`cursor-pointer w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-150 text-left group
                ${isActive ? "border-navy bg-navy" : "border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50"}
                ${loading && loading !== r.id ? "opacity-40" : ""}`}
            >
              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isActive ? "bg-white" : c.dot}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${isActive ? "text-white" : "text-slate-800"}`}>{r.name}</p>
                {r.description && (
                  <p className={`text-[11px] truncate ${isActive ? "text-slate-300" : "text-slate-400"}`}>{r.description}</p>
                )}
              </div>
              {loading === r.id ? (
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin opacity-60" />
              ) : isActive ? (
                <Check size={14} className="text-white" />
              ) : (
                <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}