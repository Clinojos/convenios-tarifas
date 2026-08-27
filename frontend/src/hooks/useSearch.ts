import { useState, useEffect, useCallback, useRef } from "react";
import { API_BASE_URL } from "@/config/api";
import { ENDPOINTS } from "@/config/endpoints";

const PAGE_SIZE = 8;

export function useSearch(query: string) {
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // true desde que cambia el texto hasta que se dispara el fetch real
  // (cubre la espera del debounce). Mientras esto es true, el dropdown no
  // muestra nada (ni "buscando" ni "no encontrado") — eso solo se decide
  // cuando isPending pasa a false e isLoading toma el control.
  const [isPending, setIsPending] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const offsetRef = useRef(0);
  const queryRef = useRef(query);
  // guarda el AbortController de la última petición "de búsqueda nueva"
  // (no de loadMore) para poder cancelarla si el usuario ya escribió otra cosa
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    queryRef.current = query;

    // cancela cualquier búsqueda anterior que siga en vuelo: si no,
    // se quedan corriendo queries lentas "zombie" en el backend mientras
    // el usuario ya sigue escribiendo, y eso satura la base de datos
    abortRef.current?.abort();

    if (query.length < 1) {
      setResults([]);
      setIsOpen(false);
      setHasMore(false);
      setIsLoading(false);
      setIsPending(false);
      offsetRef.current = 0;
      return;
    }

    // Se marca "pendiente" YA, apenas cambia el texto. Como este efecto se
    // vuelve a correr en cada tecleo (limpiando el setTimeout anterior),
    // isPending se queda en true de forma continua mientras el usuario
    // sigue escribiendo — recién se apaga cuando pasan 300ms sin cambios
    // y arranca el fetch real.
    setIsPending(true);

    const handler = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;

      // Acá sí arranca la búsqueda de verdad: se apaga "pendiente" y se
      // prende "cargando", que es lo único que dispara el "Buscando...".
      setIsPending(false);
      setIsLoading(true);
      offsetRef.current = 0;
      try {
        const response = await fetch(
          `${API_BASE_URL}${ENDPOINTS.SEARCH}?q=${encodeURIComponent(query)}&limit=${PAGE_SIZE}&offset=0`,
          { signal: controller.signal },
        );
        const data = await response.json();

        if (queryRef.current !== query) return; // el usuario ya cambió la búsqueda

        const newResults = data.results || [];
        setResults(newResults);
        setHasMore(Boolean(data.has_more));
        offsetRef.current = newResults.length;
        setIsOpen(true);
      } catch (error: any) {
        if (error?.name !== "AbortError") {
          console.error("Error buscando:", error);
        }
      } finally {
        if (abortRef.current === controller) {
          setIsLoading(false);
        }
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [query]);

  const loadMore = useCallback(async () => {
    if (isLoading || isLoadingMore || !hasMore || query.length < 1) return;

    const currentQuery = query;
    setIsLoadingMore(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}${ENDPOINTS.SEARCH}?q=${encodeURIComponent(currentQuery)}&limit=${PAGE_SIZE}&offset=${offsetRef.current}`,
      );
      const data = await response.json();

      if (queryRef.current !== currentQuery) return;

      const newResults = data.results || [];
      setResults((prev) => [...prev, ...newResults]);
      setHasMore(Boolean(data.has_more));
      offsetRef.current += newResults.length;
    } catch (error) {
      console.error("Error cargando más resultados:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [query, isLoading, isLoadingMore, hasMore]);

  return {
    results,
    isLoading,
    isPending,
    isLoadingMore,
    isOpen,
    setIsOpen,
    hasMore,
    loadMore,
  };
}
