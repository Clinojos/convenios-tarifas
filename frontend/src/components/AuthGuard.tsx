"use client";

import { usePermissions } from "@/hooks/usePermissions";
import { useRouter } from "next/navigation";

export const AuthGuard = ({ permission, children }: { permission: string, children: React.ReactNode }) => {
  const { hasPermission, loading } = usePermissions();

  // Si está cargando, retornamos null, pero al estar envuelto en Suspense 
  // en el componente Page, el Suspense detectará que no hay nada listo
  // y mostrará el fallback que definamos allí.
  if (loading) return null; 

  if (!hasPermission(permission)) {
    // Aquí puedes manejar la redirección si no tiene permisos
    return null; 
  }

  return <>{children}</>;
};