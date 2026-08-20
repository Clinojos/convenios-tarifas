"use client";

import { FilterBar } from "@/components/ui/FilterBar";
import UsersList from "./UsersList";
import { Pagination } from "@/components/ui/Pagination";

const UsersSkeleton = () => (
  <div className="bg-white rounded-xl border border-slate-100 overflow-hidden animate-pulse">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-slate-50 last:border-0">
        <div className="space-y-1.5">
          <div className="h-3 w-32 bg-slate-100 rounded" />
          <div className="h-2 w-20 bg-slate-100 rounded" />
        </div>
        <div className="h-4 w-16 bg-slate-100 rounded" />
      </div>
    ))}
  </div>
);

interface UsersListPanelProps {
  pageSize: number;
  filters: any;
  activeFilters: any[];
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  loadingUsers: boolean;
  users: any[];
  total: number;
  page: number;
  onPageChange: (p: number) => void;
  selectedUserId?: string;
  onSelectUser: (user: any) => void;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  // 👇 opcional: si el padre ya tiene las cifras reales (de toda la data, no solo la página actual), pásalas aquí
  totalWithAccess?: number;
  totalWithoutRole?: number;
}

export default function UsersListPanel({
  pageSize,
  filters,
  activeFilters,
  onFilterChange,
  onClearFilters,
  hasActiveFilters,
  loadingUsers,
  users,
  total,
  page,
  onPageChange,
  selectedUserId,
  onSelectUser,
  searchQuery,
  onSearchChange,
  totalWithAccess,
  totalWithoutRole,
}: UsersListPanelProps) {
  const totalPages = Math.ceil(total / pageSize) || 1;

  // Fallback: si no vienen las cifras reales por props, se calculan solo con
  // los usuarios de la página actual (no representan el total real, ojo).
  const pageWithAccess = users?.filter((u) => u.hasAccess).length ?? 0;
  const pageWithoutRole = users?.filter((u) => !u.role).length ?? 0;

  const kpis = [
    { title: "Total usuarios", val: total },
    { title: "Con acceso", val: totalWithAccess ?? pageWithAccess },
    { title: "Sin rol", val: totalWithoutRole ?? pageWithoutRole },
  ];

  return (
    <div className="flex flex-col h-full min-h-[520px]">
      {/* KPIs */}
      <div className="shrink-0 grid grid-cols-3 gap-3 mb-4">
        {kpis.map((kpi) => (
          <div key={kpi.title} className="bg-white rounded-xl border border-slate-100 px-4 py-2.5">
            <p className="text-[10px] font-medium opacity-80 uppercase text-slate-400">{kpi.title}</p>
            <p className="text-lg font-bold mt-0.5 text-navy">{kpi.val}</p>
          </div>
        ))}
      </div>

      <div className="shrink-0">
        <FilterBar
          filters={filters}
          activeFilters={activeFilters}
          onFilterChange={onFilterChange}
          onClear={onClearFilters}
          hasActiveFilters={hasActiveFilters}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
        />
      </div>

      <div className="flex-1 mt-3">
        {loadingUsers ? (
          <UsersSkeleton />
        ) : (
          <UsersList users={users} selectedUserId={selectedUserId} onSelect={onSelectUser} />
        )}
      </div>

      <div className="shrink-0 mt-4 pt-3 border-t border-slate-100">
        <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
      </div>
    </div>
  );
}