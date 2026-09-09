"use client";

import { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react";
import { Search, Layers } from "lucide-react";
import { useTarifario } from "@/hooks/useTarifario";
import { Pagination } from "@/components/ui/Pagination"; // ajusta la ruta según donde guardes el archivo

function formatCOP(valor: number) {
  return valor.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

// Las tarifas SOAT no manejan valor en pesos: en vez de mostrar "$0" en la
// columna Valor, mostramos "UVB {año actual}". El año se calcula en vivo,
// así que no hay que tocar esto cada enero. El nombre de la tarifa (badge
// de la columna "Tarifa") NO se toca, sigue mostrando "SOAT ..." tal cual
// viene del backend.
function getSoatValueLabel() {
  return `UVB ${new Date().getFullYear()}`;
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

  // Cubre la ventana del debounce de búsqueda (ver efecto 3): sin esto,
  // entre que el usuario deja de escribir y el fetch realmente sale disparado
  // (350ms después), loadingItems sigue en false y se alcanza a ver el
  // mensaje de "sin procedimientos" con los items viejos, antes de que la
  // búsqueda nueva ni siquiera se haya lanzado.
  const [isDebouncing, setIsDebouncing] = useState(false);

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

  // 3. Búsqueda con debounce simple, siempre vuelve a la página 1.
  // Mientras el timeout está corriendo marcamos isDebouncing en true, para
  // que el skeleton se mantenga visible y no se alcance a ver el estado
  // "sin procedimientos" con los items de la búsqueda anterior.
  useEffect(() => {
    if (!activePortfolio) return;
    setIsDebouncing(true);
    const timeout = setTimeout(() => {
      Promise.resolve(fetchItems(activePortfolio, search || undefined, 1, rowsPerPage)).finally(() =>
        setIsDebouncing(false),
      );
    }, 350);
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

  // Loading combinado: portafolios, items en vuelo, o debounce de búsqueda
  // corriendo. Cualquiera de los tres debe mostrar skeleton, nunca el
  // estado vacío.
  const isLoading = loadingPortfolios || loadingItems || isDebouncing;

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

      {isLoading ? (
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
                  const tariffLabel = item.tariff_name || item.tariff_code || "";
                  const isISS = tariffLabel.toUpperCase().startsWith("ISS");
                  const isSOAT = tariffLabel.toUpperCase().startsWith("SOAT");

                  // Para tarifas ISS, siempre mostramos porcentaje (nunca precio fijo),
                  // incluso si el item trae final_price > 0. Para tarifas SOAT, nunca
                  // mostramos precio fijo ni porcentaje: siempre "UVB {año}".
                  const hasFixedPrice = !isISS && !isSOAT && item.final_price > 0;

                  // ISS: 100% = sin recargo -> "0%" (dato válido). 0% = sin dato -> N/A.
                  const percentDisplayISS =
                    item.percent === 0
                      ? "N/A"
                      : `${(item.percent - 100).toFixed(2).replace(/\.00$/, "")}%`;

                  // No-ISS/No-SOAT sin precio fijo: 100% = sin recargo pero sí hay
                  // tarifa -> "$0". 0% = no configurado -> N/A. Cualquier otro valor ->
                  // porcentaje normal.
                  let nonISSDisplay: string;
                  if (item.percent === 100) {
                    nonISSDisplay = formatCOP(0);
                  } else if (item.percent === 0) {
                    nonISSDisplay = "N/A";
                  } else {
                    nonISSDisplay = `${(item.percent - 100).toFixed(2).replace(/\.00$/, "")}%`;
                  }

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
                      {/* Columna Valor: SOAT usa un contenedor flex + justify-end en vez
                          de depender de text-right en el <td>, porque un <span>
                          inline-block (el badge) no siempre queda perfectamente al
                          filo derecho igual que el texto plano de las demás filas.
                          Con flex justify-end el badge y el precio quedan exactamente
                          en el mismo eje vertical derecho, fila tras fila. */}
                      <td
                        className={`py-2 font-medium ${
                          isHighlighted ? "border-y-2 border-r-2 border-primary/60 rounded-r-lg" : ""
                        } ${
                          isSOAT
                            ? "text-slate-500"
                            : hasFixedPrice || (!isISS && item.percent === 100)
                              ? "text-navy"
                              : "text-slate-500"
                        }`}
                      >
                        <div className="flex items-center justify-end">
                          {isSOAT ? (
                            <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-50 text-slate-500">
                              {getSoatValueLabel()}
                            </span>
                          ) : hasFixedPrice ? (
                            formatCOP(item.final_price)
                          ) : isISS ? (
                            percentDisplayISS
                          ) : (
                            nonISSDisplay
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={goToPage}
            totalItems={total}
            itemLabel="procedimiento"
            disabled={loadingItems}
          />
        </>
      ) : (
        <div className="mt-6 py-10 text-center flex-1 min-h-0">
          <p className="text-[13px] font-semibold text-navy">
            {search.trim()
              ? "Sin procedimientos encontrados para esta búsqueda"
              : "Sin procedimientos encontrados para este portafolio"}
          </p>
        </div>
      )}
    </div>
  );
}