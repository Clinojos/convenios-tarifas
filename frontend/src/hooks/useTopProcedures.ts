// hooks/useTopProcedures.ts
import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/config/api";
import { getToken } from "@/lib/getToken";

export interface TopProcedure {
  code: string;
  name: string;
  visits: number;
}

export const useTopProcedures = (limit: number = 5) => {
  const [data, setData] = useState<TopProcedure[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchTop = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(
        `${API_BASE_URL}/procedures/top-consultados?limit=${limit}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!res.ok)
        throw new Error("Error al obtener procedimientos más consultados");

      const result = await res.json();
      setData(result.data || []);
    } catch (err) {
      console.error("Error en useTopProcedures:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTop();
  }, [limit]);

  return { data, loading };
};

// Fire-and-forget, igual que registerConvenioVisit: no bloquea la
// navegación ni maneja loading/error en la UI.
export const registerProcedureVisit = (code: string) => {
  const token = getToken();
  fetch(`${API_BASE_URL}/procedures/${code}/visit`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  }).catch((err) => console.error("No se pudo registrar la visita:", err));
};
