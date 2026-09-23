import { useState, useEffect, useRef } from "react";
import { API_BASE_URL } from "@/config/api";
import { ENDPOINTS } from "@/config/endpoints";
import { getToken } from "@/lib/getToken";

// Pocos resultados a proposito: en el buscador global los convenios son un
// atajo, el listado completo vive en /convenios?q=...
const LIMIT = 3;

/**
 * Busca convenios/empresas para el buscador global. Usa el mismo endpoint
 * que useConvenios (COMPANIES.GROUPS con ?q=), con el mismo debounce de
 * 300ms que useSearch para que ambas busquedas arranquen juntas.
 */
export function useConvenioSearch(query: string) {
  const [convenios, setConvenios] = useState<any[]>([]);
  const [isPending, setIsPending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();

    const q = query.trim();
    if (q.length < 1) {
      setConvenios([]);
      setIsPending(false);
      setIsLoading(false);
      return;
    }

    setIsPending(true);

    const handler = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;

      setIsPending(false);
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          page: "1",
          limit: String(LIMIT),
          q,
        });
        const res = await fetch(
          `${API_BASE_URL}${ENDPOINTS.COMPANIES.GROUPS}?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${getToken()}`,
              "Content-Type": "application/json",
            },
            signal: controller.signal,
          },
        );
        if (!res.ok) throw new Error("Error buscando convenios");

        const result = await res.json();
        setConvenios(result.data || []);
      } catch (error: any) {
        if (error?.name === "AbortError") return;
        console.error("Error buscando convenios:", error);
        setConvenios([]);
      } finally {
        if (abortRef.current === controller) setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [query]);

  return { convenios, isPending, isLoading };
}
