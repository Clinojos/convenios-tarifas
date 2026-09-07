"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { usePermissions } from "@/hooks/usePermissions";

export function RequirePermission({
  permission,
  children,
}: {
  permission: string;
  children: ReactNode;
}) {
  const { hasPermission, loading } = usePermissions();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (loading) return; // todavía no sabemos si tiene el permiso, esperamos

    if (!hasPermission(permission)) {
      // Si hay una página anterior en el historial de esta pestaña, vuelve ahí.
      // Si no (ej. abrió el link directo en pestaña nueva), manda a un lugar seguro.
      if (window.history.length > 1) {
        router.back();
      } else {
        router.replace("/dashboard");
      }
      return; // no marcamos "checked" para no mostrar el contenido ni un instante
    }

    setChecked(true);
  }, [loading, hasPermission, permission, router]);

  // Mientras se decide, no renderizamos nada del contenido protegido
  if (!checked) {
    return (
      <div className="flex h-full w-full items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}