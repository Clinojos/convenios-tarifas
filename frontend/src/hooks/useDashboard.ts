import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/config/api";
import { getToken } from "@/lib/getToken";

// Recursos soportados. Cada uno debe tener un endpoint GET /{resource}/total
// que devuelva { total: number }.
//  - "procedures"        -> /procedures/total
//  - "agreements"        -> /agreements/total         (convenios individuales, cada MENNIT)
//  - "agreements/groups" -> /agreements/groups/total  (convenios agrupados por empresa)
export type DashboardResource = "procedures" | "agreements" | "agreements/groups";

export const useDashboard = (resource: DashboardResource) => {
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchTotal = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/${resource}/total`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error(`Error al obtener el total de ${resource}`);

      const data = await res.json();
      setTotal(data.total ?? 0);
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