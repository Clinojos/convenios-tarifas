import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/config/api";
import { ENDPOINTS } from "@/config/endpoints";
import { getToken } from "@/lib/getToken";

export function usePermissionsList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Esta lógica solo se ejecuta en el navegador
    const fetchPermissions = async () => {
      const token = getToken();

      if (!token) {
        setError("No autenticado");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}${ENDPOINTS.PERMISSIONS}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || "Error cargando permisos");
        }

        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, []);

  return { data, loading, error };
}
