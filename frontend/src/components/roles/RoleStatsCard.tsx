"use client";

import { Cog, HeartPulse, ScanEye, User, Lock } from "lucide-react";
import { getRoleColor } from "./roleColors";

interface RoleStatsCardProps {
  role: any;
  totalPermissions: number;
  totalUsers: number;
  userCount: number;
  disabled?: boolean;
  onClick?: (role: any) => void;
}

const ROLE_ICONS: Record<string, any> = {
  Sistemas: Cog,
  "Talento Humano": HeartPulse,
  Portero: ScanEye,
  Empleado: User,
  default: User,
};

function getRoleIcon(name: string) {
  return ROLE_ICONS[name] ?? ROLE_ICONS.default;
}

const BAR_HEIGHTS = [40, 55, 70, 85, 100];

export function RoleStatsCard({
  role,
  totalPermissions,
  totalUsers,
  userCount,
  disabled = false,
  onClick,
}: RoleStatsCardProps) {
  const c = getRoleColor(role.name);
  const Icon = disabled ? Lock : getRoleIcon(role.name);

  // 👇 si es rol de sistema, se asume que tiene TODOS los permisos
  const activePerms = disabled ? totalPermissions : role.permissions?.length ?? 0;
  const permsPct = totalPermissions > 0 ? (activePerms / totalPermissions) * 100 : 0;
  const usersPct = totalUsers > 0 ? Math.round((userCount / totalUsers) * 100) : 0;
  const litBars = Math.round((permsPct / 100) * BAR_HEIGHTS.length);

  // solo el badge/ícono y la barra de progreso se apagan a gris;
  // el resto (nombre, número, %) conserva su color normal
  const badgeClass = disabled ? "bg-slate-200 text-slate-500" : c.badge;
  const dotClass = disabled ? "bg-slate-400" : c.dot;
  const hoverBorderClass = disabled ? "" : c.hoverBorder;

  return (
    <button
      type="button"
      onClick={disabled ? undefined : () => onClick?.(role)}
      className={`text-left bg-white rounded-2xl p-5 flex flex-col gap-4 relative
        transition-all duration-300 ease-out origin-center
        ${
          disabled
            ? "border border-slate-200 bg-slate-50/70 cursor-default"
            : `border border-slate-100 cursor-pointer hover:scale-[1.03] hover:shadow-lg hover:z-10 active:scale-[1.01] active:shadow-md ${hoverBorderClass}`
        }`}
    >
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${badgeClass}`}>
          <Icon size={18} />
        </div>
        <div className="flex items-end gap-0.5 h-6">
          {BAR_HEIGHTS.map((h, i) => (
            <span
              key={i}
              className={`w-1 rounded-full transition-colors ${i < litBars ? dotClass : "bg-slate-200"}`}
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="text-2xl font-bold text-navy">{userCount}</p>
        <p className="text-sm font-semibold text-navy mt-0.5">{role.name}</p>
        <p className="text-[11px] text-slate-400">{role.description || "Sin descripción"}</p>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400">Permisos activos</span>
          <span className="font-semibold text-navy">{activePerms}/{totalPermissions}</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${dotClass}`} style={{ width: `${permsPct}%` }} />
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px]">
        <span className="text-slate-400">Del total de usuarios</span>
        <span className={`font-semibold px-2 py-0.5 rounded-md ${badgeClass}`}>{usersPct}%</span>
      </div>
    </button>
  );
}