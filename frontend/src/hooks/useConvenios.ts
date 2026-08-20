import { useState, useEffect } from "react";
import { ConvenioGroup } from "@/types/convenio";
import { API_BASE_URL } from "@/config/api";
import { ENDPOINTS } from "@/config/endpoints";
import { getToken } from "@/lib/getToken";

interface FilterParams {
  page: number;
  searchQuery: string;
  status: string;
  id?: string | null;
  limit?: number;
}

export const useConvenios = ({
  page,
  searchQuery,
  status,
  id,
  limit = 12,
}: FilterParams) => {
  const [convenios, setConvenios] = useState<ConvenioGroup[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchConvenios = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(searchQuery && { q: searchQuery }),
        ...(status && { status: status }),
        ...(id && { id: id }),
      });

      const res = await fetch(
        `${API_BASE_URL}${ENDPOINTS.COMPANIES.GROUPS}?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!res.ok) throw new Error("Error en la respuesta");

      const result = await res.json();
      setConvenios(result.data || []);
      setTotal(result.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConvenios();
  }, [page, searchQuery, status, id, limit]);

  return {
    convenios,
    total,
    loading,
    totalPages: Math.ceil(total / limit),
  };
};
