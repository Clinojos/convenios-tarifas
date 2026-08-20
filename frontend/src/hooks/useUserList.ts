"use client";
import { useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "@/config/api";
import { getToken } from "@/lib/getToken";

interface UserParams {
  page: number;
  limit?: number;
  order?: "asc" | "desc";
  sort?: string;
  searchQuery?: string;
  type?: "all" | "with_access" | "pending";
}

// Normaliza el shape crudo del backend (ADMUSR) al shape que usan los componentes
function normalizeUser(u: any) {
  const id = u.id ?? u.AUsrId ?? u.user_id;
  const name = u.description ?? u.AUsrDsc ?? u.name ?? "";

  return {
    id,
    user_id: id,
    name, // UserRow / UserDetailsPanel leen esto
    username: id, // no hay username separado en ADMUSR, usamos el id
    groupId: u.group_id ?? u.AGrpId ?? null,
    hasAccess: u.hasAccess ?? u.has_access ?? false,
    isProtected: u.isProtected ?? u.is_protected ?? false, // 👈 nuevo
    role: u.role ?? null, // ajusta si el backend anida el rol distinto
    email: u.email ?? null,
    memberSince: u.memberSince ?? u.member_since ?? null,
  };
}

export function useUserList({
  page = 1,
  limit = 20,
  order = "asc",
  sort = "name",
  searchQuery = "",
  type = "all",
}: UserParams) {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = getToken();

    try {
      const endpoint = "/users/list";

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        order: order,
        type: type,
        ...(searchQuery && { q: searchQuery }),
      });

      const res = await fetch(
        `${API_BASE_URL}${endpoint}?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);

      const json = await res.json();
      const rawList = json.data || [];

      setData(rawList.map(normalizeUser));
      setTotal(json.total || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, limit, order, sort, searchQuery, type]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    total,
    loading,
    error,
    totalPages: Math.ceil(total / (limit || 20)),
    refetch: fetchData,
  };
}
