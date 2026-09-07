"use client";

import { useEffect, useState, useRef, useCallback, useLayoutEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Home, ChevronLeft, ChevronRight } from "lucide-react";
import { API_BASE_URL } from "@/config/api";
import { COOKIE_NAME } from "@/config/auth";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useBreadcrumb, useBreadcrumbNav } from "@/components/breadcrumb/BreadcrumbContext";
import { RequirePermission } from "@/components/auth/RequirePermission";

type ProcedureRow = {
  code: string;
  name: string;
  total_offers?: number;
};

const MIN_ROWS = 5;
const DEFAULT_ROWS = 10;

// Alturas estimadas por fila/encabezado según las clases de Tailwind usadas
// abajo (text-[12px] + py-2 en <td>, texto uppercase text-[10px] + pb-2 en
// <thead>). Usamos constantes fijas en vez de medir la primera fila real
// del <table>, para poder calcular rowsPerPage ANTES de tener datos y así
// hacer un solo fetch inicial con el límite correcto (en vez de pedir con
// DEFAULT_ROWS y luego repetir con el valor real una vez medido).
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
  // Se vuelve true en cuanto medimos el layout por primera vez. El fetch
  // inicial espera a esto para no pedir datos dos veces (una con
  // DEFAULT_ROWS "a ciegas" y otra con el valor real ya medido).
  const [rowsReady, setRowsReady] = useState(false);

  // IMPORTANTE: este ref se usa solo para MEDIR altura disponible. No debe
  // tener overflow propio ni scrollbar, porque el ResizeObserver que lo
  // observa reaccionaría a cambios de tamaño causados por su propia
  // scrollbar horizontal (aparece/desaparece según el ancho del contenido),
  // generando un loop infinito: menos altura -> menos filas -> tabla más
  // corta -> desaparece la scrollbar -> más altura -> más filas -> vuelve a
  // aparecer la scrollbar -> ... El scroll horizontal real vive en un div
  // interno aparte (ver JSX más abajo) que no se mide.
  const tableWrapperRef = useRef<HTMLDivElement | null>(null);
  const theadRef = useRef<HTMLTableSectionElement | null>(null);

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
    // Antes de tener datos usamos el thead estimado; una vez el thead real
    // está en el DOM (con datos o con skeleton, ambos lo montan) tomamos su
    // altura real si está disponible.
    const theadHeight = theadRef.current?.getBoundingClientRect().height || THEAD_HEIGHT_ESTIMATE;

    const available = containerHeight - theadHeight;
    if (available <= 0) return;

    const nextRows = Math.max(MIN_ROWS, Math.floor(available / ROW_HEIGHT_ESTIMATE));

    setRowsPerPage((prev) => {
      // Tolerancia de ±1 fila: evita toggles infinitos causados por
      // redondeos de 1px o por pequeñas variaciones de layout que no
      // representan un cambio real de tamaño de la ventana/contenedor.
      if (Math.abs(prev - nextRows) <= 1) return prev;
      return nextRows;
    });
    setRowsReady(true);
  }, []);

  useLayoutEffect(() => {
    const wrapper = tableWrapperRef.current;
    if (!wrapper) return;

    // Medición inicial inmediata (sin debounce) para que el primer fetch
    // ya salga con el rowsPerPage correcto.
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
    // Espera a la primera medición de layout para no disparar un fetch
    // "a ciegas" con DEFAULT_ROWS y luego repetirlo con el valor real.
    if (!rowsReady) return;
    fetchProcedures(page, searchParams.get("q") || "", rowsPerPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchParams, rowsPerPage, rowsReady]);

  const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));
  const isLoading = loading || isDebouncing || !rowsReady;
  // Skeleton de página completa SOLO quiando aún no hay ninguna fila en
  // pantalla (primera carga real). Si ya había datos (cambio de página,
  // búsqueda, o el ajuste automático de rowsPerPage), preferimos mantener
  // la tabla visible y solo atenuarla, para evitar el parpadeo de
  // tabla -> skeleton -> tabla en cada fetch.
  const showFullSkeleton = isLoading && rows.length === 0;
  const showStaleOverlay = isLoading && rows.length > 0;

  const goToPage = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPageInUrl(newPage);
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

        {/* Este div SOLO se usa para medir la altura disponible (ResizeObserver).
            No tiene overflow propio: por eso "overflow-hidden" en vez de
            "overflow-x-auto". El scroll horizontal real vive en el div hijo
            de abajo, para que la scrollbar horizontal (que aparece/desaparece
            según el ancho del contenido) no altere el clientHeight de este
            wrapper y dispare un loop infinito de recálculo -> fetch. */}
        <div ref={tableWrapperRef} className="mt-3 flex-1 min-h-0 overflow-hidden">
          <div className="h-full overflow-x-auto overflow-y-hidden">
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
                    <th className="font-medium pb-2 text-right w-24">Convenios</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((proc) => (
                    <tr
                      key={proc.code}
                      onClick={() => router.push(`/procedimientos/${proc.code}`)}
                      className="cursor-pointer border-t border-slate-50 hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-2 text-navy font-medium">{proc.code}</td>
                      <td className="py-2 text-slate-700 truncate max-w-0">{proc.name}</td>
                      <td className="py-2 text-right text-slate-500 font-medium">
                        {proc.total_offers ?? "—"}
                      </td>
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
          <div className="mt-4 flex items-center justify-between shrink-0">
            <p className="text-[11px] text-slate-400">
              {total} procedimiento{total !== 1 ? "s" : ""} · página {page} de {totalPages}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1 || loading}
                className="cursor-pointer flex items-center gap-1 text-[11px] font-medium px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:border-slate-300 hover:text-slate-800 transition-colors"
              >
                <ChevronLeft size={13} />
                Anterior
              </button>
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages || loading}
                className="cursor-pointer flex items-center gap-1 text-[11px] font-medium px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:border-slate-300 hover:text-slate-800 transition-colors"
              >
                Siguiente
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProceduresListPage() {
  return (
    <RequirePermission permission="procedures:view">
      <Suspense fallback={null}>
        <ProceduresListContent />
      </Suspense>
    </RequirePermission>
  );
}