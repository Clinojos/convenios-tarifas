import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/config/api";
import { ENDPOINTS } from "@/config/endpoints";
import { getToken } from "@/lib/getToken"; // 👈 agregado

export interface ConvenioGroup {
  group_key: string;
  display_name: string;
  status: string;
  total_variants: number;
  variant_nits: string[];
}

interface UseConvenioGroupsParams {
  searchQuery?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export const useConvenioGroups = ({
  searchQuery = "",
  status = "",
  page = 1,
  limit = 12,
}: UseConvenioGroupsParams) => {
  const [groups, setGroups] = useState<ConvenioGroup[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const fetchGroups = async () => {
      setLoading(true);
      try {
        const token = getToken();

        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
          ...(searchQuery && { q: searchQuery }),
          ...(status && { status }),
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
        if (!isActive) return;

        setGroups(result.data || []);
        setTotal(result.total || 0);
      } catch (err) {
        if (isActive) console.error(err);
      } finally {
        if (isActive) setLoading(false);
      }
    };

    fetchGroups();
    return () => {
      isActive = false;
    };
  }, [searchQuery, status, page, limit]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return { groups, total, totalPages, loading };
};
