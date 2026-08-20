"use client";

import { useEffect, useRef, useState } from "react";
import { User, Mail, Calendar, ShieldCheck, ShieldOff, Check, ChevronDown, Lock, X } from "lucide-react";
import { getRoleColor } from "@/components/roles/roleColors";
import { ConfirmModal } from "@/components/ui/confirm-modal";

interface UserDetailsPanelProps {
  user: any;
  roles: any[];
  onAssignRole: (userId: string, roleId: string) => Promise<void>;
  onRemoveRole: (userId: string) => Promise<void>;
  onToggleAccess: (userId: string, grant: boolean) => Promise<void>;
}

export default function UserDetailsPanel({
  user,
  roles,
  onAssignRole,
  onRemoveRole,
  onToggleAccess,
}: UserDetailsPanelProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [confirmRevokeAccess, setConfirmRevokeAccess] = useState(false);
  const [confirmRemoveRole, setConfirmRemoveRole] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setRoleDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) {
    return (
      <div className="bg-white rounded-xl border border-slate-100 p-8 flex flex-col items-center justify-center text-center h-full min-h-[480px]">
        <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
          <User size={20} className="text-slate-300" />
        </div>
        <p className="text-sm font-medium text-slate-400">Selecciona un usuario de la lista</p>
        <p className="text-xs text-slate-300 mt-1">Verás aquí sus detalles y permisos</p>
      </div>
    );
  }

  const userId = user.id || user.user_id;
  const hasAccess = !!user.hasAccess;
  const hasRole = !!user.role;
  const isProtected = !!user.isProtected;

  const handleToggleAccessClick = async () => {
    if (isProtected) return;
    if (hasAccess) {
      setConfirmRevokeAccess(true);
      return;
    }
    setLoadingAction("granting");
    await onToggleAccess(userId, true);
    setLoadingAction(null);
  };

  const handleRevoke = async () => {
    setLoadingAction("revoking");
    await onToggleAccess(userId, false);
    setLoadingAction(null);
    setConfirmRevokeAccess(false);
  };

  const handleAssign = async (roleId: string) => {
    setLoadingAction(roleId);
    setRoleDropdownOpen(false);
    await onAssignRole(userId, roleId);
    setLoadingAction(null);
  };

  const handleRemoveRole = async () => {
    setLoadingAction("removing-role");
    await onRemoveRole(userId);
    setLoadingAction(null);
    setConfirmRemoveRole(false);
  };

  const activeRoleColor = user.role ? getRoleColor(user.role.name) : null;

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5 space-y-4 font-sans">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-medium opacity-80 uppercase text-slate-400">Detalles</p>
        {isProtected && (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 bg-slate-50 px-2 py-1 rounded-full">
            <Lock size={10} /> Protegido
          </span>
        )}
      </div>

      {/* Identidad */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
        <div className="w-12 h-12 rounded-full bg-navy/5 flex items-center justify-center flex-shrink-0">
          <User size={20} className="text-navy" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-navy truncate">{user.name || "Sin nombre"}</p>
          <p className="text-[11px] text-slate-400 truncate">@{user.username || userId}</p>
          {user.email && (
            <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
              <Mail size={10} className="flex-shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>
          )}
        </div>
      </div>

      {/* Estado + metadatos */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px]">
        <div className="flex items-center gap-1.5">
          {hasAccess ? <ShieldCheck size={12} className="text-green" /> : <ShieldOff size={12} className="text-orange" />}
          <span className={hasAccess ? "text-green font-medium" : "text-orange font-medium"}>
            {hasAccess ? "Con acceso" : "Sin acceso"}
          </span>
        </div>
        {user.memberSince && (
          <div className="flex items-center gap-1.5 text-slate-400">
            <Calendar size={12} />
            <span>Desde {user.memberSince}</span>
          </div>
        )}
      </div>

      {/* 1) Acceso a la plataforma — toggle switch */}
      <div className="bg-slate-50/70 rounded-xl p-3 space-y-2">
        <p className="text-[10px] font-medium opacity-80 uppercase text-slate-400">Acceso a la Plataforma</p>

        {isProtected ? (
          <p className="text-[11px] text-slate-400 flex items-center gap-2">
            <Lock size={12} className="flex-shrink-0" />
            Este usuario está protegido y su acceso no puede modificarse.
          </p>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-700">Acceso habilitado</span>

            <button
              role="switch"
              aria-checked={hasAccess}
              onClick={handleToggleAccessClick}
              disabled={loadingAction === "granting" || loadingAction === "revoking"}
              className={`cursor-pointer relative inline-flex h-6 w-11 shrink-0 items-center rounded-full
                transition-colors duration-200 ease-out shadow-inner
                focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                disabled:cursor-not-allowed disabled:opacity-60
                ${hasAccess ? "bg-green focus-visible:ring-green/40" : "bg-slate-200 focus-visible:ring-slate-300"}`}
            >
              <span
                className={`flex items-center justify-center h-4 w-4 transform rounded-full bg-white shadow-sm
                  transition-transform duration-200 ease-out
                  ${hasAccess ? "translate-x-6" : "translate-x-1"}`}
              >
                {hasAccess ? (
                  <Check size={10} className="text-green" strokeWidth={3} />
                ) : (
                  <X size={10} className="text-slate-300" strokeWidth={3} />
                )}
              </span>
            </button>
          </div>
        )}

        <ConfirmModal
          isOpen={confirmRevokeAccess}
          onClose={() => setConfirmRevokeAccess(false)}
          onConfirm={handleRevoke}
          title="¿Revocar acceso?"
          description={`${user.name || userId} no podrá seguir ingresando a la plataforma y perderá el rol asignado.`}
        />
      </div>

      {/* 2) Rol — dropdown tipo select */}
      <div className="bg-slate-50/70 rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-medium opacity-80 uppercase text-slate-400">Asignar Rol</p>
          {hasRole && (
            <button
              onClick={() => setConfirmRemoveRole(true)}
              disabled={!hasAccess || isProtected}
              className="text-[10px] font-semibold text-danger/60 hover:text-danger cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Quitar rol
            </button>
          )}
        </div>

        {!hasAccess && (
          <p className="text-[11px] text-orange bg-orange/5 border border-orange/20 rounded-lg px-3 py-2">
            El usuario debe tener acceso para poder asignarle un rol.
          </p>
        )}

        <div ref={dropdownRef} className={`relative ${!hasAccess || isProtected ? "opacity-40 pointer-events-none" : ""}`}>
          <button
            onClick={() => setRoleDropdownOpen((v) => !v)}
            disabled={!hasAccess || isProtected || !!loadingAction}
            className={`cursor-pointer w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border transition-all duration-150 text-left
              ${
                roleDropdownOpen
                  ? "border-navy/30 ring-2 ring-navy/10"
                  : "border-slate-100 hover:border-slate-300"
              }
              ${user.role ? activeRoleColor?.badge : "bg-white"}`}
          >
            <span className="flex items-center gap-2 min-w-0">
              {user.role ? (
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${activeRoleColor?.dot}`} />
              ) : (
                <span className="w-2 h-2 rounded-full flex-shrink-0 border-2 border-dashed border-slate-300" />
              )}
              <span className={`text-xs font-semibold truncate ${user.role ? "" : "text-slate-400"}`}>
                {user.role?.name || "Sin rol asignado"}
              </span>
            </span>
            <ChevronDown
              size={14}
              className={`flex-shrink-0 transition-transform duration-200 ${
                roleDropdownOpen ? "rotate-180 text-navy" : "text-slate-400"
              }`}
            />
          </button>

          {roleDropdownOpen && (
            <div className="absolute z-10 mt-2 w-full bg-white rounded-xl border border-slate-100 shadow-xl overflow-hidden divide-y divide-slate-50">
              {roles.map((r: any) => {
                const c = getRoleColor(r.name);
                const isActive = user.role?.id === r.id;
                return (
                  <button
                    key={r.id}
                    disabled={!!loadingAction}
                    onClick={() => handleAssign(r.id)}
                    className={`cursor-pointer w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors
                      ${isActive ? c.badge : "hover:bg-slate-50"}
                      ${loadingAction && loadingAction !== r.id ? "opacity-40" : ""}`}
                  >
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${c.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{r.name}</p>
                      {r.description && (
                        <p className="text-[10px] text-slate-400 truncate">{r.description}</p>
                      )}
                    </div>
                    {loadingAction === r.id ? (
                      <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin opacity-60 flex-shrink-0" />
                    ) : isActive ? (
                      <span className="w-4 h-4 rounded-full bg-navy flex items-center justify-center flex-shrink-0">
                        <Check size={9} className="text-white" strokeWidth={3} />
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <ConfirmModal
          isOpen={confirmRemoveRole}
          onClose={() => setConfirmRemoveRole(false)}
          onConfirm={handleRemoveRole}
          title="¿Quitar rol?"
          description={`¿Estás seguro de que deseas quitar el rol de "${user.role?.name}" a ${user.name || userId}?`}
        />
      </div>
    </div>
  );
}