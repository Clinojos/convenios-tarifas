"use client";
import { useState, useEffect, useMemo } from "react";
import { Trash2, KeyRound } from "lucide-react";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import IconButton from "@/components/ui/IconButton";

export default function RoleForm({
  permissions,
  initialData,
  onClose,
  onSave,
  showOnlyPermissions = false,
  canDelete = false,
  onDelete,
}: any) {
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [selectedPerms, setSelectedPerms] = useState<string[]>(
    initialData?.permissions?.map((p: any) => p.id) || []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [view, setView] = useState(showOnlyPermissions ? "perms" : "main");
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setDescription(initialData.description || "");
      setSelectedPerms(initialData.permissions?.map((p: any) => p.id) || []);
    }
  }, [initialData]);

  const togglePermission = (id: string) => {
    setSelectedPerms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  // Agrupa los permisos por módulo, según el prefijo antes de los dos puntos del slug.
  const groupedPermissions = useMemo(() => {
    const groups: Record<string, any[]> = {};

    permissions.forEach((p: any) => {
      const slug: string = p.slug || "";
      const [prefix] = slug.split(":");
      const moduleKey = prefix && slug.includes(":") ? prefix : "General";

      if (!groups[moduleKey]) groups[moduleKey] = [];
      groups[moduleKey].push(p);
    });

    // Ordena los módulos alfabéticamente, dejando "General" al final
    return Object.entries(groups).sort(([a], [b]) => {
      if (a === "General") return 1;
      if (b === "General") return -1;
      return a.localeCompare(b);
    });
  }, [permissions]);

  const formatModuleName = (moduleKey: string) => {
    return moduleKey
      .replace(/[_-]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const toggleModuleAll = (modulePerms: any[]) => {
    const modulePermIds = modulePerms.map((p) => p.id);
    const allSelected = modulePermIds.every((id) => selectedPerms.includes(id));

    setSelectedPerms((prev) => {
      if (allSelected) {
        return prev.filter((id) => !modulePermIds.includes(id));
      }
      const newSet = new Set([...prev, ...modulePermIds]);
      return Array.from(newSet);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = { name, description, permissionIds: selectedPerms };
      initialData ? await onSave(initialData.id, payload) : await onSave(payload);
      onClose();
    } catch (err: any) {
      alert(err.message || "Ocurrió un error al guardar");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-4 font-sans" onSubmit={handleSubmit}>

      {/* VISTA PRINCIPAL */}
      {view === "main" && (
        <>
          <div className="space-y-1">
            <p className="text-[10px] uppercase font-medium opacity-80 text-navy">Nombre del rol</p>
            <input
              type="text"
              placeholder="Ej: Administrador"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl text-[12px] focus:ring-2 focus:ring-primary outline-none"
              required
            />
          </div>

          <div className="space-y-1">
            <p className="text-[10px] uppercase font-medium opacity-80 text-navy">Descripción</p>
            <textarea
              placeholder="Breve descripción del rol..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl text-[12px] min-h-[80px] max-h-[160px] outline-none resize-y overflow-auto focus:ring-2 focus:ring-primary"
            />
          </div>
        </>
      )}

      {/* VISTA PERMISOS */}
      {view === "perms" && (
        <div className="space-y-1">
          <p className="text-[10px] uppercase font-medium opacity-80 mb-2 text-navy">Permisos disponibles</p>

          <div className="space-y-3 max-h-[340px] overflow-y-auto pr-2">
            {groupedPermissions.map(([moduleKey, modulePerms]) => {
              const allSelected = modulePerms.every((p) => selectedPerms.includes(p.id));
              const someSelected = modulePerms.some((p) => selectedPerms.includes(p.id));

              return (
                <div
                  key={moduleKey}
                  className="border border-slate-200 rounded-xl overflow-hidden"
                >
                  {/* Header de módulo */}
                  <button
                    type="button"
                    onClick={() => toggleModuleAll(modulePerms)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-[11px] font-bold uppercase tracking-wide transition-colors cursor-pointer ${
                      allSelected
                        ? "bg-primary/10 text-primary"
                        : someSelected
                        ? "bg-primary/5 text-navy"
                        : "bg-slate-50 text-navy"
                    }`}
                  >
                    <span>{formatModuleName(moduleKey)}</span>
                    <span className="text-[10px] font-medium opacity-70">
                      {modulePerms.filter((p) => selectedPerms.includes(p.id)).length}/{modulePerms.length}
                    </span>
                  </button>

                  {/* Permisos del módulo */}
                  <div className="grid grid-cols-2 gap-2 p-2 bg-white">
                    {modulePerms.map((p: any) => (
                      <label
                        key={p.id}
                        className="flex items-center gap-2 p-2 border border-slate-100 rounded-lg text-[11px] cursor-pointer hover:bg-primary/5 transition-colors"
                      >
                        <input
                          type="checkbox"
                          className="cursor-pointer accent-primary"
                          checked={selectedPerms.includes(p.id)}
                          onChange={() => togglePermission(p.id)}
                        />
                        {p.name}
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Botones finales */}
      <div className="flex items-center gap-2 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="cursor-pointer flex-1 bg-navy text-white py-3 rounded-xl text-[11px] font-bold hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          {isSubmitting ? "GUARDANDO..." : (initialData ? "ACTUALIZAR ROL" : "GUARDAR ROL")}
        </button>

        <IconButton
          icon={<KeyRound size={16} />}
          label={view === "perms" ? "Volver" : `Permisos (${selectedPerms.length})`}
          onClick={() => setView(view === "perms" ? "main" : "perms")}
          type="button"
          size="md"
          colorClass="text-orange bg-orange/10 hover:bg-orange/20"
          tooltipPosition="top"
        />

        {initialData && canDelete && (
          <IconButton
            icon={<Trash2 size={16} />}
            label="Eliminar rol"
            onClick={() => setShowConfirmDelete(true)}
            type="button"
            size="md"
            colorClass="text-danger bg-danger/10 hover:bg-danger/20"
            tooltipPosition="top"
          />
        )}
      </div>

      {initialData && (
        <ConfirmModal
          isOpen={showConfirmDelete}
          onClose={() => setShowConfirmDelete(false)}
          onConfirm={() => {
            onDelete(initialData.id);
            setShowConfirmDelete(false);
            onClose();
          }}
          title="¿Eliminar rol?"
          description={`¿Estás seguro de que deseas eliminar el rol "${initialData.name}"?`}
        />
      )}
    </form>
  );
}