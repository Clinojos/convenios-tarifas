"use client";

import { Suspense, useState, useMemo } from "react";
import { UserPlus } from "lucide-react";
import Loading from "./loading";
import { useRoles } from "@/hooks/useRoles";
import { usePermissionsList } from "@/hooks/usePermissionsList";
import { usePermissions } from "@/hooks/usePermissions";
import { useUserList } from "@/hooks/useUserList";

import Modal from "@/components/ui/Modal";
import RoleForm from "@/components/roles/RoleForm";
import RolesGrid from "@/components/roles/RolesGrid";
import { FilterBar } from "@/components/ui/FilterBar";

import { toast } from "sonner";

function RolesContent() {
  const { data: roles, loading: loadingRoles, createRole, updateRole, deleteRole } = useRoles();
  const { data: permissions, loading: loadingPerms } = usePermissionsList();
  const { hasPermission, loading: loadingAuth } = usePermissions();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);

  // 🔍 Estado de búsqueda y orden
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // 🔢 Traemos TODOS los usuarios (sin paginar) solo para calcular conteos por rol.
  // Si el sistema crece a cientos/miles de usuarios, esto debería reemplazarse
  // por un endpoint de backend que devuelva el conteo directamente.
  const { data: allUsersForCount, total: totalUsersInSystem } = useUserList({
    page: 1,
    limit: 1000,
    order: "asc",
    sort: "name",
    type: "all",
    searchQuery: ""
  });

  const roleUserCounts = (allUsersForCount || []).reduce((counts: Record<string, number>, u: any) => {
    const roleId = u.role?.id;
    if (roleId) {
      counts[roleId] = (counts[roleId] || 0) + 1;
    }
    return counts;
  }, {});

  // 🔍 Filtramos y ordenamos los roles en cliente.
  // Ajusta "role.name" si tu objeto de rol usa otro campo (ej. role.nombre, role.title).
  const filteredRoles = useMemo(() => {
    let result = roles || [];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((role: any) => role.name?.toLowerCase().includes(query));
    }

    result = [...result].sort((a: any, b: any) => {
      const comparison = (a.name || "").localeCompare(b.name || "");
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [roles, searchQuery, sortOrder]);

  const handleFilterChange = (key: string, value: string) => {
    if (key === "sort") {
      setSortOrder(value === "name-desc" ? "desc" : "asc");
    } else if (key === "search") {
      setSearchQuery(value);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSortOrder("asc");
  };

  const hasActiveFilters = !!searchQuery || sortOrder !== "asc";

  const handleCreateRole = async (data: any) => {
    try {
      await createRole(data);
      toast.success("Rol creado correctamente");
      closeModal();
    } catch (error: any) {
      toast.error(error.message || "Error al crear el rol");
    }
  };

  const handleUpdateRole = async (id: string, payload: any) => {
    try {
      await updateRole(id, payload);
      toast.success("Rol actualizado correctamente");
      closeModal();
    } catch (error: any) {
      toast.error("Error al actualizar el rol.");
    }
  };

  const handleDeleteRole = async (id: string) => {
    try {
      await deleteRole(id);
      toast.info("Rol eliminado correctamente");
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar el rol");
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRole(null);
  };

  if (loadingRoles || loadingPerms || loadingAuth) return <Loading />;

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8 space-y-8 font-sans">
      <div className="flex items-end justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-navy">Administración de Roles y Permisos</h1>
      </div>

      <FilterBar
        filters={{
          sortBy: {
            value: sortOrder === "asc" ? "name-asc" : "name-desc",
            options: [
              { label: "Nombre (A-Z)", value: "name-asc" },
              { label: "Nombre (Z-A)", value: "name-desc" },
            ],
          },
        }}
        activeFilters={
          searchQuery
            ? [{
                label: `Búsqueda: ${searchQuery}`,
                key: "search",
                value: "",
                color: "bg-primary/10 text-primary-dark border-primary/20",
              }]
            : []
        }
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onFilterChange={handleFilterChange}
        onClear={clearFilters}
        hasActiveFilters={hasActiveFilters}
        actions={
          hasPermission("roles:create")
            ? [
                {
                  key: "create-role",
                  icon: UserPlus,
                  label: "Crear rol",
                  onClick: () => { setEditingRole(null); setIsModalOpen(true); },
                  colorClass: "text-primary hover:bg-primary/10",
                  tooltipPosition: "top",
                },
              ]
            : []
        }
      />

      <RolesGrid
        roles={filteredRoles}
        totalPermissions={permissions?.length || 0}
        totalUsers={totalUsersInSystem || 0}
        roleUserCounts={roleUserCounts}
        onCardClick={(role) => { setEditingRole(role); setIsModalOpen(true); }}
      />

      <Modal isOpen={isModalOpen} onClose={closeModal} title="Gestión">
        <RoleForm
          initialData={editingRole}
          permissions={permissions || []}
          onClose={closeModal}
          onSave={editingRole ? handleUpdateRole : handleCreateRole}
          canDelete={hasPermission("roles:delete")}
          onDelete={handleDeleteRole}
        />
      </Modal>
    </div>
  );
}

export default function RolesPage() {
  return (
    <Suspense fallback={<Loading />}>
      <RolesContent />
    </Suspense>
  );
}