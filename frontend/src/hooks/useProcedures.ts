import { useState, useEffect } from "react";
import { Procedure } from "../types/procedure";
import { API_BASE_URL } from "@/config/api";
import { ENDPOINTS } from "@/config/endpoints";
import { getToken } from "@/lib/getToken";

interface FilterParams {
  page: number;
  searchQuery: string;
  status: string;
  limit?: number;
}

export const useProcedures = ({
  page,
  searchQuery,
  status,
  limit = 25,
}: FilterParams) => {
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProcedures = async () => {
    setLoading(true);
    try {
      const token = getToken();

      // Construimos los parámetros solo con lo que el backend necesita
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(searchQuery && { q: searchQuery }),
        ...(status && { status: status }),
      });

      const res = await fetch(
        `${API_BASE_URL}${ENDPOINTS.PROCEDURES}?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!res.ok) throw new Error("Error al obtener procedimientos");

      const result = await res.json();
      setProcedures(result.data || []);
      setTotal(result.total || 0);
    } catch (err: any) {
      console.error("Detalle del error en useProcedures:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // Se ejecuta solo cuando cambian los filtros de búsqueda reales
  useEffect(() => {
    fetchProcedures();
  }, [page, searchQuery, status, limit]);

  return {
    procedures,
    total,
    loading,
    totalPages: Math.ceil(total / limit),
  };
};
