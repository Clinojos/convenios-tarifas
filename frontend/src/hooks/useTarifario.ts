"use client";

import { useState, useCallback } from "react";
import { API_BASE_URL } from "@/config/api";
import { getToken } from "@/lib/getToken";

export interface PortfolioSummary {
  code: string;
  name: string;
  is_active: boolean;
  total_procedures: number;
}

export interface PriceItem {
  proc_code: string;
  proc_name: string;
  tariff_code: string;
  tariff_name: string;
  base_price: number;
  percent: number;
  final_price: number;
  requires_auth: boolean;
}

interface PriceItemsResponse {
  total: number;
  page: number;
  limit: number;
  data: PriceItem[];
}

function authHeaders() {
  return {
    Authorization: `Bearer ${getToken()}`,
  };
}

const PAGE_LIMIT = 15;

export function useTarifario(contractKey: string) {
  const [portfolios, setPortfolios] = useState<PortfolioSummary[]>([]);
  const [loadingPortfolios, setLoadingPortfolios] = useState(false);

  const [items, setItems] = useState<PriceItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loadingItems, setLoadingItems] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // 1. Trae los portafolios reales del convenio
  const fetchPortfolios = useCallback(async () => {
    setLoadingPortfolios(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE_URL}/procedures/portfolios?nit=${encodeURIComponent(contractKey)}`,
        { headers: authHeaders() },
      );
      if (!res.ok) throw new Error(`Error ${res.status} cargando portafolios`);
      const data: PortfolioSummary[] = await res.json();
      setPortfolios(data);
      return data;
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoadingPortfolios(false);
    }
  }, [contractKey]);

  // 2. Trae los procedimientos de un portafolio, paginados
  const fetchItems = useCallback(
    async (portfolioCode: string, q?: string, pageArg: number = 1) => {
      setLoadingItems(true);
      setError(null);
      try {
        const url = new URL(`${API_BASE_URL}/procedures/by-portfolio`);
        url.searchParams.set("portfolio_code", portfolioCode);
        if (q) url.searchParams.set("q", q);
        url.searchParams.set("page", String(pageArg));
        url.searchParams.set("limit", String(PAGE_LIMIT));

        const res = await fetch(url.toString(), { headers: authHeaders() });
        if (!res.ok)
          throw new Error(`Error ${res.status} cargando procedimientos`);
        const data: PriceItemsResponse = await res.json();
        setItems(data.data);
        setTotal(data.total);
        setPage(data.page);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoadingItems(false);
      }
    },
    [],
  );

  return {
    portfolios,
    loadingPortfolios,
    items,
    total,
    page,
    limit: PAGE_LIMIT,
    loadingItems,
    error,
    fetchPortfolios,
    fetchItems,
  };
}
