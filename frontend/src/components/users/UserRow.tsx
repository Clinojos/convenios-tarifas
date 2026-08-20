"use client";

import { getRoleColor } from "@/components/roles/roleColors";

interface UserRowProps {
  user: any;
  isSelected?: boolean;
  onClick: () => void;
}

export default function UserRow({ user, isSelected, onClick }: UserRowProps) {
  const hasRole = !!user.role;

  return (
    <button
      onClick={onClick}
      className={`cursor-pointer w-full flex items-center justify-between gap-4 px-4 py-2.5 border-b border-slate-50 last:border-0 text-left transition-colors
        ${isSelected ? "bg-navy/5" : "hover:bg-slate-50"}`}
    >
      <div className="min-w-0 flex items-baseline gap-2">
        <p className={`text-sm font-bold truncate ${isSelected ? "text-navy" : "text-slate-800"}`}>
          {user.name || "Sin nombre"}
        </p>
        <p className="text-[11px] text-slate-400 truncate">
          @{user.username || user.id || user.user_id}
        </p>
      </div>

      {hasRole ? (
        <span className={`shrink-0 text-[10px] font-bold uppercase px-2 py-1 rounded-lg ring-1 ${getRoleColor(user.role.name).badge}`}>
          {user.role.name}
        </span>
      ) : (
        <span className="shrink-0 text-[10px] font-bold uppercase px-2 py-1 rounded-lg ring-1 bg-slate-50 text-slate-400 border-slate-200 ring-slate-200">
          Sin Rol
        </span>
      )}
    </button>
  );
}