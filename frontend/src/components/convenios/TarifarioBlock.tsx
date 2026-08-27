"use client";

import { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react";
import { Search, Layers, ChevronLeft, ChevronRight } from "lucide-react";
import { useTarifario } from "@/hooks/useTarifario";

function formatCOP(valor: number) {
  return valor.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

interface TarifarioBlockProps {
  contractKey: string;
  onPortfoliosChange?: (count: number) => void;
  initialPortfolio?: string;
  highlightCode?: string;
}

const MIN_ROWS = 3;
const DEFAULT_ROWS = 10; // usado antes de la primera medición real

export function TarifarioBlock({
  contractKey,
  onPortfoliosChange,
  initialPortfolio,
  highlightCode,
}: TarifarioBlockProps) {
  const {
    portfolios,
    loadingPortfolios,
    items,
    total,
    page,
    loadingItems,
    error,
    fetchPortfolios,
    fetchItems,
  } = useTarifario(contractKey);

  const [activePortfolio, setActivePortfolio] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Filas por página: arranca en un valor por defecto y se recalcula solo
  // según el alto real disponible + el alto real de una fila renderizada.
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS);

  const highlightRowRef = useRef<HTMLTableRowElement | null>(null);
  const didScrollRef = useRef(false);

  // Contenedor de la tabla: este es el que ocupa el espacio "sobrante"
  // dentro de la tarjeta (flex-1). Su alto real es lo que usamos para
  // calcular cuántas filas caben sin scroll.
  const tableWrapperRef = useRef<HTMLDivElement | null>(null);
  const theadRef = useRef<HTMLTableSectionElement | null>(null);
  const firstRowRef = useRef<HTMLTableRowElement | null>(null);

  // ---------------------------------------------------------------------
  // Cálculo de filas por página según el espacio disponible
  // ---------------------------------------------------------------------
  const recomputeRows = useCallback(() => {
    const wrapper = tableWrapperRef.current;
    if (!wrapper) return;

    const containerHeight = wrapper.clientHeight;
    const theadHeight = theadRef.current?.getBoundingClientRect().height ?? 28;
    // Si todavía no hay filas renderizadas (primera carga), usamos un
    // estimado razonable acorde a text-[12px] + py-2; en cuanto haya al
    // menos una fila real, se mide de verdad.
    const rowHeight = firstRowRef.current?.getBoundingClientRect().height ?? 33;

    const available = containerHeight - theadHeight;
    if (available <= 0 || rowHeight <= 0) return;

    const rows = Math.max(MIN_ROWS, Math.floor(available / rowHeight));

    setRowsPerPage((prev) => (prev === rows ? prev : rows));
  }, []);

  // Recalcula cuando el contenedor cambia de tamaño (resize de ventana,
  // sidebar que se abre/cierra, cambio de pestaña del layout, etc).
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

  // Cambios de tamaño del contenedor (sidebar que colapsa, layout que
  // cambia, etc.)
  const resizeObserver = new ResizeObserver(scheduleRecompute);
  resizeObserver.observe(wrapper);

  // Resize normal de ventana (algunos navegadores SÍ disparan esto en zoom,
  // aunque no el ResizeObserver del contenedor).
  window.addEventListener("resize", scheduleRecompute);

  // visualViewport: en móviles y en varios navegadores de escritorio, esto
  // reacciona a zoom cuando window.resize no lo hace.
  window.visualViewport?.addEventListener("resize", scheduleRecompute);

  // devicePixelRatio cambia exactamente cuando el usuario hace zoom
  // (Ctrl +/-), incluso si ningún elemento cambia su tamaño en px CSS.
  // matchMedia con ese ratio como query es el truco estándar para
  // "escuchar" cambios de zoom: cada vez que dispara, nos volvemos a
  // suscribir con el nuevo ratio para seguir escuchando el próximo cambio.
  let mql: MediaQueryList | null = null;
  const watchZoom = () => {
    mql?.removeEventListener("change", handleZoomChange);
    mql = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    mql.addEventListener("change", handleZoomChange);
  };
  const handleZoomChange = () => {
    scheduleRecompute();
    watchZoom(); // re-suscribirse con el nuevo ratio
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

  // Recalcula también apenas hay filas reales para medir (la primera vez
  // que llegan items, la altura de fila pasa de "estimada" a "real").
  useLayoutEffect(() => {
    recomputeRows();
  }, [items, recomputeRows]);

  // 1. Al montar (o si cambia el convenio, o llega un highlight nuevo desde
  // el buscador global), trae los portafolios reales del convenio.
  useEffect(() => {
    didScrollRef.current = false;

    fetchPortfolios().then((data) => {
      if (data.length > 0) {
        const target =
          initialPortfolio && data.some((p) => p.code === initialPortfolio)
            ? initialPortfolio
            : data[0].code;

        if (target === activePortfolio) {
          fetchItems(target, highlightCode || undefined, 1, rowsPerPage);
          setSearch(highlightCode || "");
        } else {
          setActivePortfolio(target);
        }
      }
      onPortfoliosChange?.(data.length);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractKey, highlightCode]);

  // 2. Cuando cambia el portafolio activo, trae su primera página.
  useEffect(() => {
    if (!activePortfolio) return;
    if (highlightCode && !didScrollRef.current) {
      setSearch(highlightCode);
    } else {
      fetchItems(activePortfolio, search || undefined, 1, rowsPerPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePortfolio]);

  // 3. Búsqueda con debounce simple, siempre vuelve a la página 1
  useEffect(() => {
    if (!activePortfolio) return;
    const timeout = setTimeout(
      () => fetchItems(activePortfolio, search || undefined, 1, rowsPerPage),
      350,
    );
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // 3b. Si cambia rowsPerPage (por resize de pantalla), vuelve a pedir la
  // página 1 con el nuevo límite — así no queda una página a medias con
  // un límite viejo.
  useEffect(() => {
    if (!activePortfolio) return;
    fetchItems(activePortfolio, search || undefined, 1, rowsPerPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowsPerPage]);

  // 4. Scroll suave hasta la fila resaltada, la primera vez que aparece.
  useEffect(() => {
    if (!highlightCode || didScrollRef.current) return;
    const found = items.some((item) => item.proc_code === highlightCode);
    if (found && highlightRowRef.current) {
      highlightRowRef.current.scrollIntoView({ block: "center", behavior: "smooth" });
      didScrollRef.current = true;
    }
  }, [items, highlightCode]);

  const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));

  const goToPage = (newPage: number) => {
    if (!activePortfolio) return;
    if (newPage < 1 || newPage > totalPages) return;
    fetchItems(activePortfolio, search || undefined, newPage, rowsPerPage);
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4 h-full flex flex-col overflow-hidden">
      {portfolios.length > 0 && (
        <div className="-mx-4 px-4 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <Layers size={13} className="text-slate-300 shrink-0" />
            {portfolios.length > 1 ? (
              portfolios.map((p) => (
                <button
                  key={p.code}
                  onClick={() => setActivePortfolio(p.code)}
                  title={p.is_active ? undefined : "Portafolio inactivo"}
                  className={`cursor-pointer whitespace-nowrap flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                    !p.is_active
                      ? activePortfolio === p.code
                        ? "bg-red-50 border-red-200 text-red-500"
                        : "bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300"
                      : activePortfolio === p.code
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"
                  }`}
                >
                  {!p.is_active && <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />}
                  {p.name}
                  {!p.is_active && <span className="text-[9px] font-medium opacity-70">(inactivo)</span>}
                </button>
              ))
            ) : (
              <span
                title={portfolios[0].is_active ? undefined : "Portafolio inactivo"}
                className={`whitespace-nowrap flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full border ${
                  portfolios[0].is_active
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-red-50 border-red-200 text-red-500"
                }`}
              >
                {!portfolios[0].is_active && <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />}
                {portfolios[0].name}
                {!portfolios[0].is_active && <span className="text-[9px] font-medium opacity-70">(inactivo)</span>}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mt-3 shrink-0">
        <div className="flex-1 flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-1.5">
          <Search size={13} className="text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar código CUPS o descripción..."
            className="flex-1 text-[12px] outline-none placeholder:text-slate-400"
          />
        </div>
      </div>

      {error && <p className="mt-3 text-[12px] text-red-500 shrink-0">{error}</p>}

      {loadingPortfolios || loadingItems ? (
        <div className="mt-3 space-y-2 flex-1 min-h-0 overflow-hidden">
          {Array.from({ length: rowsPerPage }).map((_, i) => (
            <div key={i} className="h-8 bg-slate-50 rounded animate-pulse" />
          ))}
        </div>
      ) : items.length > 0 ? (
        <>
          {/* flex-1 min-h-0: este SÍ tiene un alto fijo (lo que sobra en
              la tarjeta). overflow-y-hidden porque la cantidad de filas
              ya viene calculada para que quepan exactas; overflow-x-auto
              se mantiene por si en pantallas angostas la tabla se angosta
              demasiado. */}
          <div ref={tableWrapperRef} className="mt-3 flex-1 min-h-0 overflow-x-auto overflow-y-hidden">
            <table className="w-full text-[12px] border-separate border-spacing-0">
              <thead ref={theadRef}>
                <tr className="text-left text-slate-400 text-[10px] uppercase tracking-wide">
                  <th className="font-medium pb-2">Código CUPS</th>
                  <th className="font-medium pb-2">Descripción del servicio</th>
                  <th className="font-medium pb-2">Tarifa</th>
                  <th className="font-medium pb-2 text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const isHighlighted = item.proc_code === highlightCode;
                  const hasFixedPrice = item.final_price > 0;

                  return (
                    <tr
                      key={item.proc_code}
                      ref={(el) => {
                        if (idx === 0) firstRowRef.current = el;
                        if (isHighlighted) highlightRowRef.current = el;
                      }}
                      className={isHighlighted ? "bg-primary/5" : "border-t border-slate-50"}
                    >
                      <td
                        className={`py-2 text-navy font-medium ${
                          isHighlighted ? "border-y-2 border-l-2 border-primary/60 rounded-l-lg pl-2" : ""
                        }`}
                      >
                        {item.proc_code}
                      </td>
                      <td className={`py-2 text-slate-700 ${isHighlighted ? "border-y-2 border-primary/60" : ""}`}>
                        {item.proc_name}
                      </td>
                      <td className={`py-2 ${isHighlighted ? "border-y-2 border-primary/60" : ""}`}>
                        <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-50 text-slate-500">
                          {item.tariff_name || item.tariff_code}
                        </span>
                      </td>
                      <td
                        className={`py-2 text-right font-medium ${
                          isHighlighted ? "border-y-2 border-r-2 border-primary/60 rounded-r-lg" : ""
                        } ${hasFixedPrice ? "text-navy" : "text-slate-500"}`}
                      >
                        {hasFixedPrice
                          ? formatCOP(item.final_price)
                          : item.percent === 100 || item.percent === 0
                            ? "N/A"
                            : `${(item.percent - 100).toFixed(2).replace(/\.00$/, "")}%`}
                      </td>
                    </tr>
                  );
                })}
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
                disabled={page <= 1 || loadingItems}
                className="cursor-pointer flex items-center gap-1 text-[11px] font-medium px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:border-slate-300 hover:text-slate-800 transition-colors"
              >
                <ChevronLeft size={13} />
                Anterior
              </button>
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages || loadingItems}
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
          <p className="text-[13px] font-semibold text-navy">Sin tarifario cargado en este portafolio</p>
        </div>
      )}
    </div>
  );
}