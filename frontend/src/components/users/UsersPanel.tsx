"use client";

import { FilterBar } from "@/components/ui/FilterBar";
import UsersGrid from "../roles/UsersList";
import { Pagination } from "@/components/ui/Pagination";

const UsersSkeleton = () => (
  <div className="bg-white rounded-xl border border-slate-100 overflow-hidden animate-pulse">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="flex items-center justify-between px-6 py-4 border-b border-slate-50 last:border-0">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-slate-100" />
          <div className="space-y-2">
            <div className="h-3 w-24 bg-slate-100 rounded" />
            <div className="h-2 w-16 bg-slate-100 rounded" />
          </div>
        </div>
        <div className="h-4 w-16 bg-slate-100 rounded" />
      </div>
    ))}
  </div>
);

interface UsersPanelProps {
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
  onSelectUser: (user: any) => void;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
}

export default function UsersPanel({
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
  onSelectUser,
  searchQuery,
  onSearchChange,
}: UsersPanelProps) {

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    // Estructura vertical que empuja el footer al fondo
    <div className="flex flex-col h-full min-h-[600px]">
      
      {/* Filtros */}
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

      {/* Grilla: Ocupa el espacio restante pero NO tiene scroll */}
      <div className="flex-1">
        {loadingUsers ? (
          <UsersSkeleton />
        ) : (
          <UsersGrid 
            users={users} 
            onSelect={onSelectUser} 
            searchQuery={searchQuery}
          />
        )}
      </div>

      {/* Paginación: Siempre fija abajo porque flex-1 empuja este bloque */}
      <div className="shrink-0 mt-8 pt-4 border-t border-slate-100">
        <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
      </div>
    </div>
  );
}