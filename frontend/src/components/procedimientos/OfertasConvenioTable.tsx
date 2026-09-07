"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Layers, ChevronLeft, ChevronRight } from "lucide-react";

export type Offer = {
  contract_key: string;
  convenio_name: string;
  company_name: string;
  portfolio_name: string;
  portfolio_is_active: boolean;
  price: number;
  tariff_name?: string | null;
  tariff_code?: string | null;
  percent?: number | null;
  is_active: boolean;
  route: string;
};

const INK = "var(--navy)";
const MUTED = "#8A8F98";
const BORDER = "#E7E9EE";
const SURFACE = "#F7F8FA";
const LOW = "var(--success)";

const INACTIVE_BG = "#FEF2F2";
const INACTIVE_FG = "#EF4444";

// Se usa antes de la primera medición real (ver recomputeRows).
const DEFAULT_ROWS = 12;
const MIN_ROWS = 3;

export const formatPrice = (n: number) =>
  n.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

export function getSoatValueLabel() {
  return `UVB ${new Date().getFullYear()}`;
}

export function getTariffFlags(offer: Offer) {
  const label = offer.tariff_name || offer.tariff_code || "";
  const upper = label.toUpperCase();
  const isISS = upper.startsWith("ISS");
  const isSOAT = upper.startsWith("SOAT");
  const hasFixedPrice = !isISS && !isSOAT && offer.price > 0;
  return { label, isISS, isSOAT, hasFixedPrice };
}

interface OfertasConvenioTableProps {
  rows: Offer[];
  page: number;
  onPageChange: (page: number) => void;
  emptyMessage: string;
}

export function OfertasConvenioTable({ rows, page, onPageChange, emptyMessage }: OfertasConvenioTableProps) {
  const router = useRouter();

  // Filas por página: arranca en un valor por defecto y se recalcula solo
  // según el alto real disponible + el alto real de una fila renderizada
  // (mismo approach que TarifarioBlock, en vez de constantes fijas en px).
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS);

  // Alto disponible para filas (container - thead). Se usa para repartir
  // ese espacio entre las filas de la página actual y que siempre llenen
  // el contenedor, incluso cuando la última página tiene menos filas.
  const [availableHeight, setAvailableHeight] = useState(0);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const theadRef = useRef<HTMLTableSectionElement | null>(null);
  const firstRowRef = useRef<HTMLTableRowElement | null>(null);

  const recomputeRows = useCallback(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const containerHeight = wrapper.clientHeight;
    const theadHeight = theadRef.current?.getBoundingClientRect().height ?? 37;
    // Si todavía no hay filas renderizadas usamos un estimado razonable;
    // en cuanto haya al menos una fila real, se mide de verdad.
    const rowHeight = firstRowRef.current?.getBoundingClientRect().height ?? 41;

    const available = containerHeight - theadHeight;
    if (available <= 0 || rowHeight <= 0) return;

    setAvailableHeight(available);

    const fit = Math.max(MIN_ROWS, Math.floor(available / rowHeight));
    setRowsPerPage((prev) => (prev === fit ? prev : fit));
  }, []);

  // Recalcula cuando el contenedor cambia de tamaño (resize de ventana,
  // sidebar que se abre/cierra, zoom, etc). Igual que TarifarioBlock.
  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
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

    // devicePixelRatio cambia exactamente cuando el usuario hace zoom
    // (Ctrl +/-); matchMedia con ese ratio es el truco estándar para
    // "escuchar" cambios de zoom.
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

    recomputeRows();

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(debounceTimeout);
      resizeObserver.disconnect();
      window.removeEventListener("resize", scheduleRecompute);
      window.visualViewport?.removeEventListener("resize", scheduleRecompute);
      mql?.removeEventListener("change", handleZoomChange);
    };
  }, [recomputeRows]);

  // Recalcula también cuando cambia el set de filas (nueva búsqueda/orden):
  // la primera fila real puede tener un alto distinto al estimado.
  useLayoutEffect(() => {
    recomputeRows();
  }, [rows, recomputeRows]);

  const totalPages = Math.max(1, Math.ceil(rows.length / rowsPerPage));

  // Si cambia rowsPerPage (zoom) o el total de filas (filtro/orden nuevo) y
  // la página actual queda fuera de rango, la ajustamos a la última válida
  // en vez de dejar la tabla vacía.
  useLayoutEffect(() => {
    if (page > totalPages) {
      onPageChange(totalPages);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowsPerPage, totalPages]);

  const pageRows = rows.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  // Alto que le toca a cada fila de la página actual repartiendo el alto
  // disponible entre las filas que hay (no entre rowsPerPage): así, si la
  // última página tiene menos filas de las que caben, se estiran para
  // llenar el contenedor y no queda espacio vacío abajo.
  const rowHeightPx =
    pageRows.length > 0 && availableHeight > 0 ? availableHeight / pageRows.length : undefined;

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    onPageChange(p);
  };

  return (
    <>
      {/* Único contenedor flexible: crece/se achica para llenar el espacio
          sobrante (flex-1 min-h-0) y su alto real es lo que mide
          recomputeRows para decidir cuántas filas caben. */}
      <div
        ref={wrapperRef}
        className="bg-white border rounded-2xl overflow-hidden flex-1 min-h-0"
        style={{ borderColor: BORDER }}
      >
        {pageRows.length === 0 ? (
          <div className="py-14 text-center">
            <p className="text-[13px] font-semibold" style={{ color: INK }}>
              {emptyMessage}
            </p>
          </div>
        ) : (
          <table className="w-full table-fixed text-[12px] border-separate border-spacing-0">
            <thead ref={theadRef}>
              <tr className="text-left text-[10px] uppercase tracking-wide" style={{ color: MUTED }}>
                <th className="font-medium px-4 py-2.5 w-[24%]">Empresa</th>
                <th className="font-medium px-4 py-2.5 w-[26%]">Convenio</th>
                <th className="font-medium px-4 py-2.5 w-[22%]">Portafolio</th>
                <th className="font-medium pl-4 pr-1 py-2.5 text-right w-[12%]">Tarifa</th>
                <th className="font-medium pl-2 pr-4 py-2.5 text-right w-[16%]">Valor</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((offer, idx) => {
                const rowInactive = !offer.is_active || !offer.portfolio_is_active;
                const { label: tariffLabel, isISS, isSOAT, hasFixedPrice } = getTariffFlags(offer);
                const percent = offer.percent ?? 100;

                const percentDisplayISS =
                  percent === 0 ? "N/A" : `${(percent - 100).toFixed(2).replace(/\.00$/, "")}%`;

                let nonISSDisplay: string;
                if (percent === 100) {
                  nonISSDisplay = formatPrice(0);
                } else if (percent === 0) {
                  nonISSDisplay = "N/A";
                } else {
                  nonISSDisplay = `${(percent - 100).toFixed(2).replace(/\.00$/, "")}%`;
                }

                return (
                  <tr
                    key={`${offer.contract_key}-${offer.portfolio_name}-${offer.convenio_name}-${idx}`}
                    ref={(el) => {
                      if (idx === 0) firstRowRef.current = el;
                    }}
                    onClick={() => router.push(offer.route)}
                    className={`cursor-pointer transition-colors hover:bg-[#FAFBFC] ${rowInactive ? "opacity-50" : ""}`}
                    style={{
                      borderTop: `1px solid ${BORDER}`,
                      height: rowHeightPx ? `${rowHeightPx}px` : undefined,
                    }}
                  >
                    <td className="px-4 py-3 overflow-hidden align-middle">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ background: rowInactive ? "#C9CDD4" : LOW }}
                          aria-hidden
                        />
                        <Building2 size={11} className="text-slate-400 shrink-0" />
                        <span className="truncate font-medium" style={{ color: INK }}>
                          {offer.company_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 overflow-hidden align-middle">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="truncate">{offer.convenio_name}</span>
                        {!offer.is_active && (
                          <span
                            className="shrink-0 text-[9px] font-semibold px-1.5 py-0.5 rounded"
                            style={{ background: "#EDEEF1", color: MUTED }}
                          >
                            Inactivo
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 overflow-hidden align-middle">
                      <div className="flex items-center gap-1.5 text-slate-600 min-w-0">
                        <Layers size={11} className="text-slate-400 shrink-0" />
                        <span className="truncate">{offer.portfolio_name}</span>
                        {!offer.portfolio_is_active && (
                          <span
                            title="Portafolio inactivo"
                            className="shrink-0 text-[9px] font-semibold px-1.5 py-0.5 rounded"
                            style={{ background: INACTIVE_BG, color: INACTIVE_FG }}
                          >
                            Inactivo
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="pl-4 pr-1 py-3 overflow-hidden text-right align-middle">
                      <span className="truncate text-slate-500 block" title={tariffLabel || undefined}>
                        {tariffLabel || "—"}
                      </span>
                    </td>
                    <td className="pl-2 pr-4 py-3 overflow-hidden align-middle">
                      <div className="flex items-center justify-end">
                        {isSOAT ? (
                          <span
                            className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0"
                            style={{ background: SURFACE, color: MUTED }}
                          >
                            {getSoatValueLabel()}
                          </span>
                        ) : (
                          <span
                            className="font-mono font-semibold tabular-nums shrink-0 truncate"
                            style={{ color: hasFixedPrice || (!isISS && percent === 100) ? LOW : MUTED }}
                          >
                            {hasFixedPrice ? formatPrice(offer.price) : isISS ? percentDisplayISS : nonISSDisplay}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-1 shrink-0">
            <p className="text-[11px]" style={{ color: MUTED }}>
            {rows.length} oferta{rows.length !== 1 ? "s" : ""} · página {page} de {totalPages}
            </p>
            <div className="flex items-center gap-1.5">
            <button
                onClick={() => goToPage(page - 1)}
                disabled={page === 1}
                className="cursor-pointer flex items-center gap-1 text-[11px] font-medium px-3 py-1.5 rounded-lg border disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white"
                style={{ borderColor: BORDER, color: MUTED }}
            >
                <ChevronLeft size={13} />
                Anterior
            </button>
            <button
                onClick={() => goToPage(page + 1)}
                disabled={page === totalPages}
                className="cursor-pointer flex items-center gap-1 text-[11px] font-medium px-3 py-1.5 rounded-lg border disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white"
                style={{ borderColor: BORDER, color: MUTED }}
            >
                Siguiente
                <ChevronRight size={13} />
            </button>
            </div>
        </div>
        )}
    </>
  );
}