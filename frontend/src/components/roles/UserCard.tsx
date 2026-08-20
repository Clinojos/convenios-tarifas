"use client";

import { Clock } from "lucide-react";
import { getRoleColor } from "./roleColors";

interface UserCardProps {
  userId: string;
  role?: { name: string } | null;
  isPending?: boolean;
  onClick: () => void;
}

export default function UserCard({ userId, role, isPending, onClick }: UserCardProps) {
  const initials = String(userId).slice(0, 2).toUpperCase();
  const roleColor = role ? getRoleColor(role.name) : null;

  return (
    <button
      onClick={onClick}
      className="group relative cursor-pointer bg-white ring-1 ring-slate-100 rounded-2xl px-4 py-4 flex items-center gap-3 text-left hover:ring-slate-300 hover:shadow-sm active:scale-[0.98] transition-all duration-200"
    >
      <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-[11px] font-bold uppercase text-slate-500 flex-shrink-0">
        {isPending ? <Clock size={14} className="text-slate-400" /> : initials}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-slate-800 truncate">{userId}</p>

        {isPending ? (
          <span className="inline-flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="text-[10px] font-medium uppercase text-slate-400">Sin rol</span>
          </span>
        ) : role ? (
          <span className="inline-flex items-center gap-1.5 mt-0.5">
            <span className={`w-1.5 h-1.5 rounded-full ${roleColor?.dot}`} />
            <span className="text-[10px] font-medium uppercase text-slate-400 truncate">{role.name}</span>
          </span>
        ) : null}
      </div>
    </button>
  );
}
