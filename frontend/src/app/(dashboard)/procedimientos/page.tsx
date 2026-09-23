"use client";

import { useEffect, useState, useRef, useCallback, useLayoutEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Home } from "lucide-react";
import { API_BASE_URL } from "@/config/api";
import { COOKIE_NAME } from "@/config/auth";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useBreadcrumb, useBreadcrumbNav } from "@/components/breadcrumb/BreadcrumbContext";
import { Pagination } from "@/components/ui/Pagination";
import { registerProcedureVisit } from "@/hooks/useTopProcedures";

type ProcedureRow = {
  code: string;
  name: string;
  total_offers?: number;
};

const MIN_ROWS = 5;
const DEFAULT_ROWS = 10;

// Estos valores son solo el ESTIMADO inicial, usado antes de tener
// cualquier fila real en el DOM (para el fetch a ciegas y el skeleton).
// En cuanto hay thead/fila reales, recomputeRows usa su altura real
// (getBoundingClientRect), que es lo que corrige el corte de la última
// fila a distintos niveles de zoom (donde el estimado fijo ya no aplica).
const THEAD_HEIGHT_ESTIMATE = 28;
const ROW_HEIGHT_ESTIMATE = 33;

function ProceduresListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page")) || 1;

  const [rows, setRows] = useState<ProcedureRow[]>([]);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState(searchParams.get("q") || "");
  const debouncedSearch = useDebouncedValue(searchInput, 350);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const isDebouncing = searchInput !== debouncedSearch;

  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS);
  const [rowsReady, setRowsReady] = useState(false);

  const tableWrapperRef = useRef<HTMLDivElement | null>(null);
  const theadRef = useRef<HTMLTableSectionElement | null>(null);
  // NUEVO: ref a la primera fila real del tbody, para medir su altura
  // exacta tal como se renderiza (fuente, padding, zoom, etc.) en vez de
  // asumir ROW_HEIGHT_ESTIMATE siempre.
  const firstRowRef = useRef<HTMLTableRowElement | null>(null);

  const { setListUrl, listUrl } = useBreadcrumbNav();

  useBreadcrumb([
    {
      id: "home",
      label: "Procedimientos",
      icon: Home,
      onClick: () => router.push(listUrl || "/procedimientos"),
    },
  ]);

  useEffect(() => {
    setListUrl(`/procedimientos?${searchParams.toString()}`);
  }, [searchParams, setListUrl]);

  function setPageInUrl(newPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`/procedimientos?${params.toString()}`);
  }

  function setSearchInUrl(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");
    if (value) params.set("q", value);
    else params.delete("q");
    router.push(`/procedimientos?${params.toString()}`);
  }

  const recomputeRows = useCallback(() => {
    const wrapper = tableWrapperRef.current;
    if (!wrapper) return;

    const containerHeight = wrapper.clientHeight;
    const theadHeight = theadRef.current?.getBoundingClientRect().height || THEAD_HEIGHT_ESTIMATE;
    // NUEVO: si ya hay una fila real en el DOM, usamos su altura exacta.
    // Esto es lo que evita el desfase a distintos niveles de zoom (90%,
    // 110%, etc.) que antes causaba que la última fila quedara cortada
    // por el overflow-y-hidden del contenedor.
    const rowHeight = firstRowRef.current?.getBoundingClientRect().height || ROW_HEIGHT_ESTIMATE;

    const available = containerHeight - theadHeight;
    if (available <= 0) return;

    const nextRows = Math.max(MIN_ROWS, Math.floor(available / rowHeight));

    setRowsPerPage((prev) => {
      if (Math.abs(prev - nextRows) <= 1) return prev;
      return nextRows;
    });
    setRowsReady(true);
  }, []);

  useLayoutEffect(() => {
    const wrapper = tableWrapperRef.current;
    if (!wrapper) return;

    recomputeRows();

    let frame: number;
    let debounceTimeout: ReturnType<typeof setTimeout>;
    const scheduleRecompute = () => {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(recomputeRows);
      }, 120);
    };

    const resizeObserver = new ResizeObserver(scheduleRecompute);
    resizeObserver.observe(wrapper);

    window.addEventListener("resize", scheduleRecompute);
    window.visualViewport?.addEventListener("resize", scheduleRecompute);

    let mql: MediaQueryList | null = null;
    const watchZoom = () => {
      mql?.removeEventListener("change", handleZoomChange);
      mql = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      mql.addEventListener("change", handleZoomChange);
    };
    const handleZoomChange = () => {
      scheduleRecompute();
      watchZoom();
    };
    watchZoom();

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener("resize", scheduleRecompute);
      window.visualViewport?.removeEventListener("resize", scheduleRecompute);
      mql?.removeEventListener("change", handleZoomChange);
    };
  }, [recomputeRows]);

  // NUEVO: en cuanto llegan filas reales (no skeleton) al DOM, volvemos a
  // medir en el siguiente frame. La primera vez que se calculó
  // rowsPerPage no había ninguna fila real todavía, así que se usó el
  // estimado; esta segunda pasada corrige con la altura real ya pintada
  // (esto es lo que arregla el corte al 90% de zoom u otros valores donde
  // el estimado fijo no coincide con el alto real de la fila).
  useEffect(() => {
    if (rows.length === 0) return;
    const frame = requestAnimationFrame(recomputeRows);
    return () => cancelAnimationFrame(frame);
  }, [rows, recomputeRows]);

  function fetchProcedures(targetPage: number, search: string, limit: number) {
    setLoading(true);
    setError(false);

    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${COOKIE_NAME}=`))
      ?.split("=")[1];

    if (!token) {
      setError(true);
      setLoading(false);
      return;
    }

    const params = new URLSearchParams({
      page: String(targetPage),
      limit: String(limit),
    });
    if (search.trim()) params.set("q", search.trim());

    fetch(`${API_BASE_URL}/procedures?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error("fetch failed");
        return r.json();
      })
      .then((data) => {
        setRows(data.data ?? []);
        setTotal(data.total ?? 0);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (debouncedSearch !== (searchParams.get("q") || "")) {
      setSearchInUrl(debouncedSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  useEffect(() => {
    if (!rowsReady) return;
    fetchProcedures(page, searchParams.get("q") || "", rowsPerPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchParams, rowsPerPage, rowsReady]);

  const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));
  const isLoading = loading || isDebouncing || !rowsReady;
  const showFullSkeleton = isLoading && rows.length === 0;
  const showStaleOverlay = isLoading && rows.length > 0;

  const goToPage = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPageInUrl(newPage);
  };

  // NUEVO: registra la visita al procedimiento (para el ranking de
  // "Procedimientos más consultados" del dashboard) y recién después
  // navega al detalle. Fire-and-forget, igual que registerConvenioVisit:
  // si el POST falla no bloquea ni retrasa la navegación.
  const openProcedure = (code: string) => {
    registerProcedureVisit(code);
    router.push(`/procedimientos/${code}`);
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <div>
        <h1 className="text-[16px] font-bold text-navy">Procedimientos</h1>
        <p className="text-[12px] text-slate-500">
          {total} procedimiento{total !== 1 ? "s" : ""} registrados
        </p>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4 h-full min-h-0 flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex-1 flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-1.5">
            <Search size={13} className="text-slate-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar código CUPS o nombre del procedimiento..."
              className="flex-1 text-[12px] outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        {error && <p className="mt-3 text-[12px] text-red-500 shrink-0">Error al cargar los procedimientos.</p>}

        <div className="mt-3 flex-1 min-h-0 overflow-hidden relative">
          <div
            ref={tableWrapperRef}
            className="absolute inset-0 invisible pointer-events-none"
            aria-hidden="true"
          />

          <div className="max-h-full overflow-x-auto overflow-y-hidden">
            {showFullSkeleton ? (
              <div className="space-y-2">
                {Array.from({ length: rowsPerPage }).map((_, i) => (
                  <div key={i} className="h-8 bg-slate-50 rounded animate-pulse" />
                ))}
              </div>
            ) : rows.length > 0 ? (
              <table
                className={`w-full text-[12px] border-separate border-spacing-0 transition-opacity duration-150 ${
                  showStaleOverlay ? "opacity-50" : "opacity-100"
                }`}
              >
                <thead ref={theadRef}>
                  <tr className="text-left text-slate-400 text-[10px] uppercase tracking-wide">
                    <th className="font-medium pb-2 w-28">Código CUPS</th>
                    <th className="font-medium pb-2">Nombre del procedimiento</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((proc, i) => (
                    <tr
                      key={proc.code}
                      ref={i === 0 ? firstRowRef : undefined}
                      onClick={() => openProcedure(proc.code)}
                      className="cursor-pointer border-t border-slate-50 hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-2 text-navy font-medium">{proc.code}</td>
                      <td className="py-2 text-slate-700 truncate max-w-0">{proc.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-10 text-center">
                <p className="text-[13px] font-semibold text-navy">
                  {searchInput.trim()
                    ? "Sin procedimientos encontrados para esta búsqueda"
                    : "No hay procedimientos registrados"}
                </p>
              </div>
            )}
          </div>
        </div>

        {(!isLoading || showStaleOverlay) && rows.length > 0 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={goToPage}
            totalItems={total}
            itemLabel="procedimiento"
            disabled={loading}
          />
        )}
      </div>
    </div>
  );
}

export default function ProceduresListPage() {
  return (
    <Suspense fallback={null}>
      <ProceduresListContent />
    </Suspense>
  );
}