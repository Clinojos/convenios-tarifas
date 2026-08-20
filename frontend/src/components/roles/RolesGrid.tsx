"use client";

import { RoleStatsCard } from "./RoleStatsCard";

interface RolesGridProps {
  roles: any[];
  totalPermissions: number;
  totalUsers: number;
  roleUserCounts: Record<string, number>;
  onCardClick: (role: any) => void;
}

export default function RolesGrid({ roles, totalPermissions, totalUsers, roleUserCounts, onCardClick }: RolesGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.isArray(roles) &&
        roles.map((role: any) => {
          const isLocked = !!role.isSystem; // 👈 rol del sistema, no se puede editar/borrar

          return (
            <RoleStatsCard
              key={role.id}
              role={role}
              totalPermissions={totalPermissions}
              totalUsers={totalUsers}
              userCount={roleUserCounts[role.id] || 0}
              disabled={isLocked}
              onClick={isLocked ? undefined : onCardClick}
            />
          );
        })}
    </div>
  );
}