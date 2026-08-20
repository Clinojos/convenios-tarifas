"use client";

import { useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "@/config/api";
import { ENDPOINTS } from "@/config/endpoints";
import { getToken } from "@/lib/getToken";

export function useRoles() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getHeaders = useCallback(() => {
    if (typeof document === "undefined") return null;

    const token = getToken();

    if (!token) {
      console.error(
        "🚨 [useRoles] No se encontró la cookie de sesión. El Header de autorización irá vacío.",
      );
      return null;
    }

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token.trim()}`,
    };
  }, []);

  const fetchRoles = useCallback(async () => {
    const headers = getHeaders();

    if (!headers) {
      setError("No autenticado");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      console.log("📡 [useRoles] Enviando petición a roles...");
      const response = await fetch(`${API_BASE_URL}${ENDPOINTS.ROLES.BASE}`, {
        method: "GET",
        headers: headers,
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error(
            "403 Forbidden: Tu rol actual no tiene permiso para listar roles.",
          );
        }
        throw new Error(`Error al obtener los roles: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err: any) {
      console.error("❌ [useRoles Fetch Error]:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const createRole = async (roleData: {
    name: string;
    description: string;
    external_group_key?: string;
    permissionIds?: string[];
  }) => {
    const headers = getHeaders();
    if (!headers) throw new Error("Sesión expirada o inválida");

    const res = await fetch(`${API_BASE_URL}${ENDPOINTS.ROLES.BASE}`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(roleData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Error al crear");
    }
    await fetchRoles();
  };

  const updateRole = async (
    roleId: string,
    roleData: {
      name: string;
      description: string;
      external_group_key?: string;
      permissionIds?: string[];
    },
  ) => {
    const headers = getHeaders();
    if (!headers) throw new Error("Sesión expirada o inválida");

    const res = await fetch(`${API_BASE_URL}${ENDPOINTS.ROLES.BASE}${roleId}`, {
      method: "PATCH",
      headers: headers,
      body: JSON.stringify(roleData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Error al actualizar");
    }
    await fetchRoles();
  };

  const deleteRole = async (roleId: string) => {
    const headers = getHeaders();
    if (!headers) throw new Error("Sesión expirada o inválida");

    const res = await fetch(`${API_BASE_URL}${ENDPOINTS.ROLES.BASE}${roleId}`, {
      method: "DELETE",
      headers: headers,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Error al eliminar");
    }
    await fetchRoles();
  };

  const assignRole = async (userId: string, roleId: string) => {
    const headers = getHeaders();
    if (!headers) throw new Error("Sesión expirada o inválida");

    const res = await fetch(`${API_BASE_URL}${ENDPOINTS.ROLES.ASSIGN}`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        user_id: userId,
        role_id: roleId,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Error al asignar rol");
    }
  };

  const removeRole = async (userId: string) => {
    const headers = getHeaders();
    if (!headers) throw new Error("Sesión expirada");

    const res = await fetch(
      `${API_BASE_URL}${ENDPOINTS.ROLES.ASSIGN}/${userId}`,
      {
        method: "DELETE",
        headers: headers,
      },
    );

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Error al quitar rol");
    }
  };

  return {
    data,
    loading,
    error,
    createRole,
    updateRole,
    deleteRole,
    assignRole,
    removeRole,
    refresh: fetchRoles,
  };
}
