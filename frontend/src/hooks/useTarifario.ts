"use client";

import { useState, useCallback, useRef } from "react";
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
  const [limit, setLimit] = useState(10); // valor inicial de arranque, se recalcula en el componente según el alto disponible
  const [loadingItems, setLoadingItems] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // Referencia a la petición de items en vuelo. Cuando sale una petición
  // nueva, cancelamos la anterior con AbortController. Así, si el scroll
  // dispara varios recálculos de rowsPerPage seguidos (varios fetch en
  // paralelo), solo la última puede terminar actualizando el estado — las
  // anteriores se abortan y nunca pisan total/page/items con datos viejos.
  const abortRef = useRef<AbortController | null>(null);

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

  // Ahora recibe el limit como parámetro: quien llama decide cuántas filas
  // pedir (TarifarioBlock lo calcula según el alto disponible en pantalla).
  const fetchItems = useCallback(
    async (
      portfolioCode: string,
      q: string | undefined,
      pageArg: number,
      limitArg: number,
    ) => {
      // Cancela cualquier petición anterior que siga en vuelo antes de
      // lanzar esta.
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoadingItems(true);
      setError(null);
      try {
        const url = new URL(`${API_BASE_URL}/procedures/by-portfolio`);
        url.searchParams.set("portfolio_code", portfolioCode);
        if (q) url.searchParams.set("q", q);
        url.searchParams.set("page", String(pageArg));
        url.searchParams.set("limit", String(limitArg));

        const res = await fetch(url.toString(), {
          headers: authHeaders(),
          signal: controller.signal,
        });
        if (!res.ok)
          throw new Error(`Error ${res.status} cargando procedimientos`);
        const data: PriceItemsResponse = await res.json();

        // Por si, entre el fetch y el json(), ya salió una petición más
        // nueva: no pisamos el estado con esta respuesta obsoleta.
        if (abortRef.current !== controller) return;

        setItems(data.data);
        setTotal(data.total);
        setPage(data.page);
        setLimit(data.limit ?? limitArg);
      } catch (err: any) {
        if (err.name === "AbortError") return; // cancelada a propósito, no es un error real
        setError(err.message);
      } finally {
        if (abortRef.current === controller) setLoadingItems(false);
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
    limit,
    loadingItems,
    error,
    fetchPortfolios,
    fetchItems,
  };
}
