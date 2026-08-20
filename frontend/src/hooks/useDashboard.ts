// hooks/useDashboard.ts
import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/config/api";
import { getToken } from "@/lib/getToken";

// Ahora recibe 'resource' (ej: "procedures" o "companies")
export const useDashboard = (resource: "procedures" | "companies") => {
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchTotal = async () => {
    setLoading(true);
    try {
      const token = getToken();
      // Usamos la API_BASE_URL centralizada y concatenamos el recurso dinámico
      const res = await fetch(`${API_BASE_URL}/${resource}/total`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error(`Error al obtener el total de ${resource}`);

      const data = await res.json();
      setTotal(data.total);
    } catch (err) {
      console.error(`Error en useDashboard (${resource}):`, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTotal();
  }, [resource]);

  return { total, loading };
};
