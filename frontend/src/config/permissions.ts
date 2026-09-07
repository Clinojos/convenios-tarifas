// src/config/permissions.ts
export const ROUTE_PERMISSIONS: Record<string, string> = {
  "/convenios": "agreement:view",
  "/procedimientos": "procedures:view",
  "/roles": "roles:view",
  "/users": "users:view",
  // "/dashboard" no necesita permiso, solo estar autenticado
};

export const UNAUTHORIZED_ROUTE = "/unauthorized";

export function matchProtectedRoute(pathname: string): string | undefined {
  return Object.keys(ROUTE_PERMISSIONS)
    .filter((route) => pathname === route || pathname.startsWith(`${route}/`))
    .sort((a, b) => b.length - a.length)[0];
}
