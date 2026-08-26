// frontend/src/hooks/useAuth.ts
import { useState } from "react";
import { jwtDecode } from "jwt-decode";
import { API_BASE_URL } from "@/config/api";
import { ENDPOINTS } from "@/config/endpoints";
import { COOKIE_NAME } from "@/config/auth";

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getUser = () => {
    if (typeof document === "undefined") return null;

    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${COOKIE_NAME}=`))
      ?.split("=")[1];

    if (!token) return null;

    try {
      const decoded: any = jwtDecode(token);
      return {
        email: decoded.sub,
        role: decoded.role,
        permissions: decoded.permissions || [],
      };
    } catch {
      return null;
    }
  };

  const login = async (identifier: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}${ENDPOINTS.AUTH.LOGIN}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Credenciales incorrectas");
      }

      // El backend ya valida el ACCESO a la plataforma (no el rol).
      // Un usuario puede loguearse sin rol asignado; simplemente no
      // tendrá permisos hasta que un admin le asigne uno.
      document.cookie = `${COOKIE_NAME}=${data.access_token}; path=/; max-age=86400; SameSite=Lax`;
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setLoading(false); // Importante: deshabilitar loading si hay error
    }
  };

  return { login, loading, error, getUser };
}
