"use client";

import { useEffect, useState, useRef, useCallback, useLayoutEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Home, ChevronLeft, ChevronRight } from "lucide-react";
import { API_BASE_URL } from "@/config/api";
import { COOKIE_NAME } from "@/config/auth";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useBreadcrumb, useBreadcrumbNav } from "@/components/breadcrumb/BreadcrumbContext";

type ProcedureRow = {
  code: string;
  name: string;
  total_offers?: number;
};

const MIN_ROWS = 5;
const DEFAULT_ROWS = 10;

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

  const tableWrapperRef = useRef<HTMLDivElement | null>(null);
  const theadRef = useRef<HTMLTableSectionElement | null>(null);
  const firstRowRef = useRef<HTMLTableRowElement | null>(null);

  const { setListUrl, listUrl } = useBreadcrumbNav();

  useBreadcrumb([
    {
      id: "home",
      label: "Inicio",
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
    const theadHeight = theadRef.current?.getBoundingClientRect().height ?? 28;
    const rowHeight = firstRowRef.current?.getBoundingClientRect().height ?? 33;

    const available = containerHeight - theadHeight;
    if (available <= 0 || rowHeight <= 0) return;

    const nextRows = Math.max(MIN_ROWS, Math.floor(available / rowHeight));

    setRowsPerPage((prev) => (prev === nextRows ? prev : nextRows));
  }, []);

  useLayoutEffect(() => {
    const wrapper = tableWrapperRef.current;
    if (!wrapper) return;

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

  useLayoutEffect(() => {
    recomputeRows();
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
    fetchProcedures(page, searchParams.get("q") || "", rowsPerPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchParams, rowsPerPage]);

  const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));
  const isLoading = loading || isDebouncing;

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

        {isLoading ? (
          <div className="mt-3 space-y-2 flex-1 min-h-0 overflow-hidden">
            {Array.from({ length: rowsPerPage }).map((_, i) => (
              <div key={i} className="h-8 bg-slate-50 rounded animate-pulse" />
            ))}
          </div>
        ) : rows.length > 0 ? (
          <>
            <div ref={tableWrapperRef} className="mt-3 flex-1 min-h-0 overflow-x-auto overflow-y-hidden">
              <table className="w-full text-[12px] border-separate border-spacing-0">
                <thead ref={theadRef}>
                  <tr className="text-left text-slate-400 text-[10px] uppercase tracking-wide">
                    <th className="font-medium pb-2 w-28">Código CUPS</th>
                    <th className="font-medium pb-2">Nombre del procedimiento</th>
                    <th className="font-medium pb-2 text-right w-24">Convenios</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((proc, idx) => (
                    <tr
                      key={proc.code}
                      ref={(el) => {
                        if (idx === 0) firstRowRef.current = el;
                      }}
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
            </div>

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
          </>
        ) : (
          <div className="mt-6 py-10 text-center flex-1 min-h-0">
            <p className="text-[13px] font-semibold text-navy">
              {searchInput.trim()
                ? "Sin procedimientos encontrados para esta búsqueda"
                : "No hay procedimientos registrados"}
            </p>
          </div>
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