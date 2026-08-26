// hooks/useTopConvenios.ts
import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/config/api";
import { getToken } from "@/lib/getToken";

export interface TopConvenio {
  group_key: string; // ahora es el contract_key del convenio individual
  display_name: string; // nombre del convenio (ej. "BANCO")
  company_name: string | null; // razón social de la empresa matriz (ej. "Bancolombia S.A.")
  is_active: boolean;
  visits: number;
  type: "propio" | "descuento" | null;
}

export const useTopConvenios = (limit: number = 5) => {
  const [data, setData] = useState<TopConvenio[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchTop = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(
        `${API_BASE_URL}/agreements/top-consultadas?limit=${limit}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!res.ok)
        throw new Error("Error al obtener convenios más consultados");

      const result = await res.json();
      setData(result.data || []);
    } catch (err) {
      console.error("Error en useTopConvenios:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTop();
  }, [limit]);

  return { data, loading };
};
