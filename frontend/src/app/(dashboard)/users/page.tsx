"use client";

import { Suspense, useState } from "react";
import Loading from "./loading";
import { useRoles } from "@/hooks/useRoles";
import { useUserList } from "@/hooks/useUserList";
import { useUserFilters } from "@/hooks/useUserFilters";

import UsersListPanel from "@/components/users/UsersListPanel";
import UserDetailsPanel from "@/components/users/UserDetailsPanel";

import { toast } from "sonner";
import { API_BASE_URL } from "@/config/api";
import { getToken } from "@/lib/getToken";

const PAGE_SIZE = 8;

function UsersContent() {
  const { data: roles, loading: loadingRoles, assignRole, removeRole } = useRoles();

  const {
    filterValues, debouncedSearch, currentPage, setCurrentPage,
    handleFilterChange, clearFilters, userType, filterConfig
  } = useUserFilters();

  const [selectedUser, setSelectedUser] = useState<any>(null);

  const {
    data: displayUsers,
    total: displayTotal,
    loading: loadingUsers,
    refetch
  } = useUserList({
    page: currentPage,
    limit: PAGE_SIZE,
    order: filterValues.sort === "name-desc" ? "desc" : "asc",
    sort: "name",
    type: userType as "all" | "assigned" | "pending",
    searchQuery: debouncedSearch
  });

  // 👇 Ya no se auto-selecciona ningún usuario al cargar la página

  const handleAssignRole = async (userId: string, roleId: string) => {
    try {
      await assignRole(userId, roleId);
      await refetch();
      const newRole = roles.find((r: any) => r.id === roleId);
      setSelectedUser((prev: any) => (prev ? { ...prev, role: newRole } : prev));
      toast.success("Rol asignado correctamente");
    } catch (error: any) {
      toast.error(error.message || "Error al asignar rol");
    }
  };

  const handleRemoveRole = async (userId: string) => {
    try {
      await removeRole(userId);
      await refetch();
      setSelectedUser((prev: any) => (prev ? { ...prev, role: null } : prev));
      toast.info("Rol eliminado correctamente");
    } catch (error: any) {
      toast.error("No se pudo eliminar el rol");
    }
  };

  const handleToggleAccess = async (userId: string, grant: boolean) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/users/${userId}/access`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ access: grant }),
      });

      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);

      await refetch();
      setSelectedUser((prev: any) =>
        prev ? { ...prev, hasAccess: grant, role: grant ? prev.role : null } : prev
      );
      toast.success(grant ? "Acceso concedido correctamente" : "Acceso revocado correctamente");
    } catch (error: any) {
      toast.error(error.message || "No se pudo actualizar el acceso");
    }
  };

  if (loadingRoles) return <Loading />;

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8 space-y-8 font-sans">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-navy">Gestión de Usuarios y Accesos</h1>
        <p className="text-xs text-slate-400 mt-1">
          Panel para administrar los accesos y perfiles del personal de la clínica.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
        <UsersListPanel
          pageSize={PAGE_SIZE}
          loadingUsers={loadingUsers}
          users={displayUsers}
          total={displayTotal}
          page={currentPage}
          onPageChange={setCurrentPage}
          selectedUserId={selectedUser?.id || selectedUser?.user_id}
          onSelectUser={setSelectedUser}
          filters={filterConfig}
          searchQuery={filterValues.search}
          onSearchChange={(val) => handleFilterChange("search", val)}
          activeFilters={[
            ...(filterValues.status ? [{
              label: filterValues.status === "active" ? "Activos" : "Sin Rol",
              key: "status",
              value: filterValues.status,
              color: filterValues.status === "active"
                ? "bg-green/10 text-green border-green/20"
                : "bg-orange/10 text-orange border-orange/20"
            }] : []),
            ...(filterValues.search ? [{
              label: `Búsqueda: ${filterValues.search}`,
              key: "search",
              value: "",
              color: "bg-primary/10 text-primary-dark border-primary/20"
            }] : [])
          ]}
          onFilterChange={handleFilterChange}
          onClearFilters={clearFilters}
          hasActiveFilters={!!filterValues.status || !!filterValues.search}
        />

        <UserDetailsPanel
          user={selectedUser}
          roles={roles}
          onAssignRole={handleAssignRole}
          onRemoveRole={handleRemoveRole}
          onToggleAccess={handleToggleAccess}
        />
      </div>
    </div>
  );
}

export default function UsersPage() {
  return (
    <Suspense fallback={<Loading />}>
      <UsersContent />
    </Suspense>
  );
}