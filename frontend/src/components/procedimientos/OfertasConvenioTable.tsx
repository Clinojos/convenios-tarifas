"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Building2, Layers, ChevronRight, Tag, AlertCircle, ArrowDown, ArrowUp, FileText } from "lucide-react";
import { Pagination } from "@/components/ui/Pagination"; // ajusta la ruta según donde guardes el archivo

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

type SortBy = "" | "price_asc" | "price_desc" | "iss_asc" | "iss_desc";

// Tokens tomados de globals.css — nada de colores inventados.
const INK = "var(--navy)";
const ACCENT = "var(--primary)";
const ACCENT_DARK = "var(--primary-dark)";
const PURPLE = "var(--purple)";
const MUTED = "#8A8F98";
const BORDER = "#E7E9EE";
const SURFACE = "#F7F8FA";
const INACTIVE = "#C9CDD4";
const INACTIVE_FG = "#B3B8C2";

const LOW = "var(--success)";
const HIGH = "var(--danger)";
const WARNING_FG = "var(--orange-dark)";

// Mismo estilo de tooltip que usa el Sidebar cuando está contraído.
const TOOLTIP_BORDER = "#D9EEF8";
const TOOLTIP_FG = "#6B9BAE";

// Alto fijo de cada fila. La CANTIDAD de filas por página ya NO es fija:
// se calcula solo, midiendo cuánto espacio hay disponible (ver
// useAvailableRows más abajo), así nunca aparece scroll y siempre es
// responsivo al tamaño de pantalla / zoom.
const ROW_HEIGHT = 72;
const DEFAULT_ROWS_PER_PAGE = 8; // solo para el primer render, antes de medir

// Alto SIEMPRE reservado para el pie de paginación del panel de detalle
// (derecha), tenga o no controles visibles. Antes ese contenedor solo se
// renderizaba cuando había más de una página de convenios, así que el alto
// disponible del panel cambiaba según la empresa seleccionada. Eso disparaba
// el ResizeObserver, recalculaba rowsPerPage, eso recalculaba cuántas
// páginas de EMPRESAS había, y terminaba reseteando/saltando la selección.
// Reservando el alto siempre, el panel nunca cambia de tamaño por esto.
const DETAIL_FOOTER_HEIGHT = 44;

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

export function getValueDisplay(offer: Offer): string {
  const { isSOAT, hasFixedPrice } = getTariffFlags(offer);
  const percent = offer.percent ?? 100;

  if (isSOAT) return getSoatValueLabel();
  if (hasFixedPrice) return formatPrice(offer.price);
  if (percent === 0) return "N/A";
  return `${(percent - 100).toFixed(2).replace(/\.00$/, "")}%`;
}

type CompanyGroup = {
  companyName: string;
  offers: Offer[];
  singleValue: string | null;
  sortMinPrice: number | null;
  sortMaxPrice: number | null;
  activeCount: number;
  totalCount: number;
};

function groupByCompany(rows: Offer[]): CompanyGroup[] {
  const map = new Map<string, Offer[]>();

  for (const offer of rows) {
    const existing = map.get(offer.company_name);
    if (existing) existing.push(offer);
    else map.set(offer.company_name, [offer]);
  }

  return Array.from(map.entries()).map(([companyName, offers]) => {
    const distinctValues = Array.from(new Set(offers.map((o) => getValueDisplay(o))));
    const singleValue = distinctValues.length === 1 ? distinctValues[0] : null;

    const fixedPriced = offers.filter((o) => getTariffFlags(o).hasFixedPrice);
    const prices = fixedPriced.map((o) => o.price);
    const sortMinPrice = prices.length > 0 ? Math.min(...prices) : null;
    const sortMaxPrice = prices.length > 0 ? Math.max(...prices) : null;

    const activeCount = offers.filter((o) => o.is_active && o.portfolio_is_active).length;

    return {
      companyName,
      offers,
      singleValue,
      sortMinPrice,
      sortMaxPrice,
      activeCount,
      totalCount: offers.length,
    };
  });
}

// Mide en vivo cuánto alto tiene un contenedor (con ResizeObserver, así que
// reacciona a resize de ventana Y a zoom del navegador) y devuelve cuántas
// filas de ROW_HEIGHT entran exactamente ahí.
function useRowsThatFit(rowHeight: number) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [rows, setRows] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = (height: number) => {
      const fit = Math.max(1, Math.floor(height / rowHeight));
      setRows(fit);
    };

    measure(el.getBoundingClientRect().height);

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) measure(entry.contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [rowHeight]);

  return [ref, rows] as const;
}

// Tooltip mediante portal a document.body, con position: fixed calculada a
// partir del getBoundingClientRect del elemento. Al vivir fuera del árbol
// del contenedor con overflow-hidden, ya NUNCA se recorta. Además queda
// centrado horizontalmente respecto al elemento y se ajusta (clamp) para no
// salirse de los bordes de la pantalla. Si no hay espacio arriba, se muestra
// debajo en vez de arriba.
function TooltipPortal({ coords, text }: { coords: { top: number; left: number } | null; text: string }) {
  if (!coords || typeof document === "undefined") return null;

  const MAX_WIDTH = 280;
  const MARGIN = 8;
  const ARROW_MARGIN = 12;

  const viewportWidth = window.innerWidth;
  let left = coords.left - MAX_WIDTH / 2;
  left = Math.max(MARGIN, Math.min(left, viewportWidth - MAX_WIDTH - MARGIN));

  const arrowLeft = Math.min(Math.max(coords.left - left, ARROW_MARGIN), MAX_WIDTH - ARROW_MARGIN);
  const showBelow = coords.top < 60;

  return createPortal(
    <div
      className="fixed rounded-md bg-white border px-2.5 py-1.5 text-[10px] font-medium shadow-sm pointer-events-none text-center"
      style={{
        top: showBelow ? coords.top + 20 : coords.top - 8,
        left,
        maxWidth: MAX_WIDTH,
        transform: showBelow ? undefined : "translateY(-100%)",
        borderColor: TOOLTIP_BORDER,
        color: TOOLTIP_FG,
        zIndex: 9999,
      }}
    >
      {text}
      <span
        className="absolute h-2 w-2 rotate-45 bg-white"
        style={{
          left: arrowLeft - 4,
          ...(showBelow
            ? { top: -4, borderTop: `1px solid ${TOOLTIP_BORDER}`, borderLeft: `1px solid ${TOOLTIP_BORDER}` }
            : { bottom: -4, borderRight: `1px solid ${TOOLTIP_BORDER}`, borderBottom: `1px solid ${TOOLTIP_BORDER}` }),
        }}
      />
    </div>,
    document.body
  );
}

// Envoltorio reutilizable: detecta el hover sobre "children" y muestra el
// TooltipPortal centrado sobre ese elemento. `disabled` se usa cuando el
// texto no está truncado y por lo tanto no hace falta mostrar tooltip.
function TooltipAnchor({
  text,
  disabled,
  className,
  style,
  children,
}: {
  text: string;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  const handleEnter = () => {
    if (disabled) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setCoords({ top: rect.top, left: rect.left + rect.width / 2 });
  };
  const handleLeave = () => setCoords(null);

  return (
    <div ref={ref} onMouseEnter={handleEnter} onMouseLeave={handleLeave} className={className} style={style}>
      {children}
      {!disabled && <TooltipPortal coords={coords} text={text} />}
    </div>
  );
}

// Badge con: icono, prefijo ("Portafolio:", "Tarifario:") y tooltip si el
// texto se corta. El prefijo se queda siempre visible; solo el valor se
// trunca y muestra el tooltip completo al pasar el mouse.
function LabeledBadge({
  icon,
  prefix,
  value,
  color,
  background,
}: {
  icon: React.ReactNode;
  prefix: string;
  value: string;
  color: string;
  background: string;
}) {
  return (
    <TooltipAnchor
      text={`${prefix} ${value}`}
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-[1px] text-[10px] font-medium shrink-0 max-w-[170px]"
      style={{ background, color }}
    >
      {icon}
      <span className="shrink-0 opacity-80">{prefix}</span>
      <span className="truncate">{value}</span>
    </TooltipAnchor>
  );
}

function GroupValueBadge({ group }: { group: CompanyGroup }) {
  if (group.singleValue !== null) {
    return (
      <span
        className="font-mono font-semibold text-[11px] tabular-nums whitespace-nowrap px-1.5 py-0.5 rounded-md shrink-0"
        style={{ background: "color-mix(in srgb, var(--primary) 8%, white)", color: ACCENT_DARK }}
      >
        {group.singleValue}
      </span>
    );
  }

  const allFixedPriced = group.offers.every((o) => getTariffFlags(o).hasFixedPrice);
  const hasRange =
    allFixedPriced &&
    group.sortMinPrice !== null &&
    group.sortMaxPrice !== null &&
    group.sortMinPrice !== group.sortMaxPrice;

  if (hasRange) {
    return (
      <div className="flex flex-col items-end gap-0.5 shrink-0">
        <span className="flex items-center gap-0.5 font-mono text-[10px] font-semibold tabular-nums" style={{ color: LOW }}>
          <ArrowDown size={9} />
          {formatPrice(group.sortMinPrice as number)}
        </span>
        <span className="flex items-center gap-0.5 font-mono text-[10px] font-semibold tabular-nums" style={{ color: HIGH }}>
          <ArrowUp size={9} />
          {formatPrice(group.sortMaxPrice as number)}
        </span>
      </div>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0 whitespace-nowrap"
      style={{ background: "color-mix(in srgb, var(--navy) 8%, white)", color: INK }}
    >
      <Layers size={10} />
      Varios valores
    </span>
  );
}

interface OfertasConvenioTableProps {
  rows: Offer[];
  page: number;
  onPageChange: (page: number) => void;
  emptyMessage: string;
  sortBy?: SortBy;
}

export function OfertasConvenioTable({
  rows,
  page,
  onPageChange,
  emptyMessage,
  sortBy = "",
}: OfertasConvenioTableProps) {
  const router = useRouter();

  // Un medidor por panel: cada uno mide su propio alto disponible (el
  // panel derecho tiene un encabezado que el izquierdo no tiene, así que
  // sus alturas útiles no son iguales aunque el panel completo sí lo sea).
  // Como el pie de paginación del detalle ahora SIEMPRE reserva su alto
  // (ver DETAIL_FOOTER_HEIGHT), esta medición ya no fluctúa al cambiar de
  // empresa seleccionada.
  const [leftBodyRef, leftFit] = useRowsThatFit(ROW_HEIGHT);
  const [rightBodyRef, rightFit] = useRowsThatFit(ROW_HEIGHT);

  // Usamos el más chico de los dos para que NINGUNO de los dos se
  // desborde, y así ambos paneles siempre terminan mostrando la misma
  // cantidad de filas (mismo alto visual).
  const rowsPerPage = useMemo(() => {
    const candidates = [leftFit, rightFit].filter((v): v is number => v !== null);
    if (candidates.length === 0) return DEFAULT_ROWS_PER_PAGE;
    return Math.min(...candidates);
  }, [leftFit, rightFit]);

  const groups = useMemo(() => {
    const grouped = groupByCompany(rows);

    if (sortBy === "price_asc" || sortBy === "price_desc") {
      grouped.sort((a, b) => {
        const av = sortBy === "price_asc" ? a.sortMinPrice ?? Infinity : a.sortMaxPrice ?? -Infinity;
        const bv = sortBy === "price_asc" ? b.sortMinPrice ?? Infinity : b.sortMaxPrice ?? -Infinity;
        return sortBy === "price_asc" ? av - bv : bv - av;
      });
    } else {
      grouped.sort((a, b) => a.companyName.localeCompare(b.companyName, "es", { sensitivity: "base" }));
    }

    return grouped;
  }, [rows, sortBy]);

  const totalPages = Math.max(1, Math.ceil(groups.length / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  const pageGroups = groups.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage);

  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [detailPage, setDetailPage] = useState(1);

  useEffect(() => {
    if (selectedCompany && !groups.some((g) => g.companyName === selectedCompany)) {
      setSelectedCompany(null);
    }
  }, [groups, selectedCompany]);

  // Antes esto dependía de `safePage`, que se recalculaba solo cuando
  // `rowsPerPage` fluctuaba (por el bug del pie de detalle). Eso hacía que
  // seleccionar una empresa a veces "reseteara" la selección y saltara a
  // otra página/empresa sin que el usuario hubiera hecho clic en la
  // paginación. Ahora depende de `page` (la prop real que cambia solo
  // cuando el usuario pagina), así que solo se limpia la selección en una
  // navegación de página real.
  useEffect(() => {
    setSelectedCompany(null);
  }, [page]);

  const selectedGroup = groups.find((g) => g.companyName === selectedCompany) ?? pageGroups[0] ?? null;

  useEffect(() => {
    setDetailPage(1);
  }, [selectedGroup?.companyName]);

  const sortedDetailOffers = useMemo(() => {
    if (!selectedGroup) return [];
    return [...selectedGroup.offers].sort((a, b) =>
      a.convenio_name.localeCompare(b.convenio_name, "es", { sensitivity: "base" })
    );
  }, [selectedGroup]);

  const detailTotalPages = Math.max(1, Math.ceil(sortedDetailOffers.length / rowsPerPage));
  const safeDetailPage = Math.min(detailPage, detailTotalPages);
  const pageDetailOffers = sortedDetailOffers.slice(
    (safeDetailPage - 1) * rowsPerPage,
    safeDetailPage * rowsPerPage
  );

  if (groups.length === 0) {
    return (
      <div
        className="bg-white border rounded-2xl overflow-hidden flex-1 min-h-0 flex items-center justify-center"
        style={{ borderColor: BORDER }}
      >
        <p className="text-[13px] font-semibold" style={{ color: INK }}>
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-[360px_1fr] gap-3 flex-1 min-h-0">
        {/* Columna izquierda: una fila por EMPRESA. overflow-hidden en vez
            de overflow-y-auto: como rowsPerPage se calcula para que quepa
            exacto, nunca debería desbordar; overflow-hidden es solo la red
            de seguridad para que jamás aparezca un scrollbar. */}
        <div className="bg-white border rounded-2xl flex flex-col min-h-0 overflow-hidden" style={{ borderColor: BORDER }}>
          <div ref={leftBodyRef} className="flex-1 min-h-0 overflow-hidden">
            {pageGroups.map((group, idx) => {
              const isSelected = group.companyName === (selectedGroup?.companyName ?? "");
              const isLast = idx === pageGroups.length - 1;

              return (
                <button
                  key={group.companyName}
                  onClick={() => setSelectedCompany(group.companyName)}
                  className="w-full flex items-center justify-between gap-3 px-4 text-left transition-colors cursor-pointer"
                  style={{
                    height: ROW_HEIGHT,
                    borderBottom: isLast ? "none" : `1px solid ${BORDER}`,
                    background: isSelected ? SURFACE : "white",
                    boxShadow: isSelected ? `inset 2px 0 0 ${ACCENT}` : undefined,
                  }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: group.activeCount > 0 ? ACCENT : INACTIVE }}
                      aria-hidden
                    />
                    <TooltipAnchor
                      text={group.companyName}
                      disabled={group.companyName.length <= 24}
                      className="min-w-0"
                    >
                      <div className="truncate text-[12.5px] font-medium leading-snug" style={{ color: INK }}>
                        {group.companyName}
                      </div>
                      <div className="flex items-center gap-1 mt-1" style={{ color: MUTED }}>
                        <Building2 size={11} className="shrink-0 opacity-70" />
                        <span className="text-[10.5px]">
                          {group.totalCount} convenio{group.totalCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </TooltipAnchor>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <GroupValueBadge group={group} />
                    <ChevronRight size={13} className="text-slate-300 shrink-0" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Columna derecha: una fila por CONVENIO. */}
        <div className="bg-white border rounded-2xl flex flex-col min-h-0 overflow-hidden" style={{ borderColor: BORDER }}>
          {!selectedGroup ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <p className="text-[12px]" style={{ color: MUTED }}>
                Selecciona una empresa para ver el detalle.
              </p>
            </div>
          ) : (
            <>
              <div
                className="shrink-0 flex items-baseline justify-between px-4 py-3"
                style={{ borderBottom: `1px solid ${BORDER}` }}
              >
                <h3 className="text-[13px] font-semibold" style={{ color: INK }}>
                  {selectedGroup.companyName}
                </h3>
                <span className="text-[11px]" style={{ color: MUTED }}>
                  {selectedGroup.totalCount} convenio{selectedGroup.totalCount !== 1 ? "s" : ""}
                </span>
              </div>

              <div ref={rightBodyRef} className="flex-1 min-h-0 overflow-hidden">
                {pageDetailOffers.map((offer, idx) => {
                  const rowInactive = !offer.is_active || !offer.portfolio_is_active;
                  const { label: tariffLabel } = getTariffFlags(offer);
                  const isLastRow = idx === pageDetailOffers.length - 1;
                  const statusNote = !offer.is_active
                    ? "Convenio inactivo"
                    : !offer.portfolio_is_active
                      ? "Portafolio inactivo"
                      : null;

                  const badgeBg = rowInactive ? "color-mix(in srgb, var(--navy) 6%, white)" : undefined;

                  return (
                    <div
                      key={`${offer.contract_key}-${offer.portfolio_name}-${offer.convenio_name}`}
                      onClick={() => router.push(offer.route)}
                      className="flex items-center justify-between gap-3 pl-3.5 pr-4 cursor-pointer transition-colors hover:bg-[#FAFBFC]"
                      style={{
                        height: ROW_HEIGHT,
                        borderBottom: isLastRow ? "none" : `1px solid ${BORDER}`,
                        borderLeft: `2.5px solid ${rowInactive ? INACTIVE : ACCENT}`,
                      }}
                    >
                      <div className="min-w-0">
                        {/* Etiqueta chiquita "Convenio" arriba del nombre,
                            mismo estilo de caption que usan las tarjetas de
                            precio más bajo/alto, para que quede claro que
                            ESTE texto es el nombre del convenio. */}
                        <TooltipAnchor
                          text={offer.convenio_name}
                          disabled={offer.convenio_name.length <= 22}
                          className="flex items-center gap-1 min-w-0"
                        >
                          <span
                            className="text-[9px] font-semibold uppercase tracking-wide shrink-0"
                            style={{ color: rowInactive ? INACTIVE_FG : MUTED }}
                          >
                            Convenio:
                          </span>
                          <span
                            className="text-[12.5px] font-medium leading-snug truncate"
                            style={{ color: rowInactive ? INACTIVE_FG : INK }}
                          >
                            {offer.convenio_name}
                          </span>
                        </TooltipAnchor>

                        <div className="flex items-center gap-1.5 mt-1.5 min-w-0 flex-wrap">
                          <LabeledBadge
                            icon={<Layers size={9.5} className="shrink-0" />}
                            prefix="Portafolio:"
                            value={offer.portfolio_name}
                            color={rowInactive ? INACTIVE_FG : ACCENT_DARK}
                            background={badgeBg ?? "color-mix(in srgb, var(--primary) 10%, white)"}
                          />

                          {tariffLabel && (
                            <LabeledBadge
                              icon={<Tag size={9.5} className="shrink-0" />}
                              prefix="Tarifario:"
                              value={tariffLabel}
                              color={rowInactive ? INACTIVE_FG : PURPLE}
                              background={badgeBg ?? "color-mix(in srgb, var(--purple) 10%, white)"}
                            />
                          )}

                          {statusNote && (
                            <span
                              className="inline-flex items-center gap-1 rounded-md px-1.5 py-[1px] text-[10px] font-medium shrink-0"
                              style={{
                                background: !offer.is_active
                                  ? "color-mix(in srgb, var(--danger) 10%, white)"
                                  : "color-mix(in srgb, var(--warning) 14%, white)",
                                color: !offer.is_active ? HIGH : WARNING_FG,
                              }}
                            >
                              <AlertCircle size={9.5} className="shrink-0" />
                              {statusNote}
                            </span>
                          )}
                        </div>
                      </div>

                      <span
                        className="font-mono font-semibold text-[13px] tabular-nums shrink-0"
                        style={{ color: rowInactive ? MUTED : ACCENT }}
                      >
                        {getValueDisplay(offer)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Este contenedor SIEMPRE ocupa DETAIL_FOOTER_HEIGHT, tenga o
                  no controles de paginación adentro. Es el fix del bug de
                  "salta de empresa/página": antes este bloque solo existía
                  en el DOM cuando detailTotalPages > 1, así que el alto del
                  panel derecho cambiaba según la empresa seleccionada. */}
              <div
                className="shrink-0 px-2 flex items-center"
                style={{
                  height: DETAIL_FOOTER_HEIGHT,
                  borderTop: detailTotalPages > 1 ? `1px solid ${BORDER}` : "1px solid transparent",
                }}
              >
                {detailTotalPages > 1 && (
                  <Pagination
                    page={safeDetailPage}
                    totalPages={detailTotalPages}
                    onPageChange={setDetailPage}
                    totalItems={sortedDetailOffers.length}
                    itemLabel="convenio"
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="shrink-0">
        <Pagination
          page={safePage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          totalItems={groups.length}
          itemLabel="empresa"
        />
      </div>
    </>
  );
}