// frontend/src/hooks/usePermissions.ts
import { useUser } from "@/context/AuthContext"; // 👈 antes: "./useUser"

export const usePermissions = () => {
  const { user, loading } = useUser();

  const hasPermission = (permissionSlug: string) => {
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permissionSlug);
  };

  return { hasPermission, loading };
};
