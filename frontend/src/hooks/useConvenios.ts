import { useState, useEffect, useRef } from "react";
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

  // `loading`: true solo en el primerísimo fetch (cuando todavía no hay
  // nada dibujado en pantalla). `isFetching`: true en CUALQUIER fetch,
  // incluidos los refetches por cambio de página/filtro/búsqueda. La grilla
  // usa `loading` para decidir si mostrar skeletons y `isFetching` para
  // decidir si atenuar las cards que ya están.
  const [loading, setLoading] = useState<boolean>(true);
  const [isFetching, setIsFetching] = useState<boolean>(true);
  const hasLoadedOnce = useRef(false);

  // Referencia al controller del fetch en curso: si las deps cambian antes
  // de que responda (ej: el usuario tipea rápido y dispara varias
  // búsquedas), abortamos el anterior para que no pise el resultado más
  // reciente con uno viejo que llega tarde (race condition clásica).
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;

    const fetchConvenios = async () => {
      setIsFetching(true);
      if (!hasLoadedOnce.current) setLoading(true);

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
            signal: controller.signal,
          },
        );

        if (!res.ok) throw new Error("Error en la respuesta");

        const result = await res.json();
        setConvenios(result.data || []);
        setTotal(result.total || 0);
      } catch (err) {
        // Un abort no es un error real, es nosotros mismos cancelando un
        // fetch obsoleto: no lo logueamos ni tocamos el estado, porque el
        // fetch que sí importa (el más nuevo) va a resolver aparte.
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.error(err);
      } finally {
        if (!controller.signal.aborted) {
          hasLoadedOnce.current = true;
          setLoading(false);
          setIsFetching(false);
        }
      }
    };

    fetchConvenios();

    return () => controller.abort();
  }, [page, searchQuery, status, id, limit]);

  return {
    convenios,
    total,
    loading,
    isFetching,
    totalPages: Math.ceil(total / limit),
  };
};

// Fire-and-forget: no bloquea la navegación ni se maneja loading/error en
// la UI — si falla, se pierde ese conteo, pero el usuario nunca se entera.
// Se exporta suelta (no como parte del hook) porque se llama desde donde
// sea que exista un "abrir convenio" (openConvenio en la página de
// listado, y potencialmente el buscador global también).
export const registerConvenioVisit = (contractKey: string) => {
  const token = getToken();
  fetch(`${API_BASE_URL}/agreements/${contractKey}/visit`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  }).catch((err) => console.error("No se pudo registrar la visita:", err));
};
