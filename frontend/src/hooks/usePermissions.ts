// frontend/src/hooks/usePermissions.ts
import { useUser } from "./useUser";

export const usePermissions = () => {
  const { user, loading } = useUser(); // 🚨 Traemos "loading" de useUser

  const hasPermission = (permissionSlug: string) => {
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permissionSlug);
  };

  return { hasPermission, loading }; // 🚨 Devolvemos loading aquí
};
