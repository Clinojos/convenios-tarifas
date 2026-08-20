"use client";
import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/config/api";
import { ENDPOINTS } from "@/config/endpoints";
import { COOKIE_NAME } from "@/config/auth"; // 👈 agregar este import

export function useUser() {
  const [user, setUser] = useState({
    id: "",
    role: "",
    name: "Usuario",
    initial: "U",
    permissions: [] as string[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith(`${COOKIE_NAME}=`)) // 👈 cambio aquí
        ?.split("=")[1];

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}${ENDPOINTS.AUTH.ME}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setUser({
            id: data.sub || "",
            role: data.role || "",
            name: data.sub || "Usuario",
            initial: (data.sub?.charAt(0) || "U").toUpperCase(),
            permissions: data.permissions || [],
          });
        }
      } catch (e) {
        console.error("Error cargando perfil:", e);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  return { user, loading };
}
