"use client";

import { useRef, useMemo, useEffect, useState, ReactNode } from "react";
import { createPortal } from "react-dom";
import { Search, Stethoscope, Building2, X, Hash, Layers, Briefcase, Loader2, FileText, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSearch } from "@/hooks/useSearch";
import { usePermissions } from "@/hooks/usePermissions";

// Un código CUPS real siempre es numérico (ver especificación §5: "470201", "097100", "088001").
// Lo usamos tanto para decidir a dónde navega Enter como, más adelante, para
// que el importador/otras pantallas puedan reutilizar el mismo criterio.
const CUPS_PATTERN = /^\d{4,6}$/;

const PAGE_SIZE_HINT = 8;

type GlobalSearchProps = {
  /** "hero": buscador grande de Inicio. "compact": pill del header. */
  variant?: "hero" | "compact";
  query: string;
  onQueryChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
};

// El backend manda la info en formatos distintos según el resultado:
//
// Convenios:      "Código: 088001 · Portafolio: CAJA DE COMPENSACION COMPENSAR · Empresa: COMPENSAR EPS · $0"
// Procedimientos: "BANCOLOMBIA S.A. · BANCOLOMBIA - $627,200.00"  (sin etiquetas, empresa · portafolio - precio)
//
// Además, para Procedimientos el backend manda el nombre del convenio en un
// campo propio (`convenio_name`, snake_case, ver /api/v1/search), separado
// del string de `details`. Antes solo se leía `item.convenioName`/`item.name`
// (camelCase) y nunca `item.convenio_name`, por eso el badge de convenio
// nunca aparecía en resultados de tipo Procedimiento.
//
// Lo separamos para poder mostrar cada dato con su propio color/ícono en
// vez de texto plano corrido, así el usuario distingue cada campo de un
// vistazo sin tener que leer nada.
const stripAccents = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

// Formatea precios a pesos colombianos sin decimales.
// OJO: si el string trae decimales tipo "627,200.00" (punto como separador
// decimal, coma de miles), hay que recortarlos ANTES de limpiar el resto de
// caracteres. Si no, "$627,200.00" -> se borra el punto -> "62720000" ->
// se muestra "$62.720.000" (¡el valor queda multiplicado por 100!).
function formatPrice(raw: string): string {
  const cleaned = raw.replace(/[^\d.,]/g, "");
  const decimalMatch = cleaned.match(/\.(\d{2})$/); // termina en ".NN" -> son centavos
  const withoutDecimals = decimalMatch ? cleaned.slice(0, -3) : cleaned;
  const numeric = Number(withoutDecimals.replace(/[.,]/g, ""));
  if (Number.isNaN(numeric)) return raw;
  return numeric.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

// Extrae el código CUPS cuando viene pegado al inicio del título
// ("088402 SUTURA PROFUNDA DE HERIDA..." -> code: "088402").
function extractCodeFromTitle(title: string): { code?: string; title: string } {
  const match = title.match(/^(\d{4,6})\s+(.+)$/);
  if (!match) return { title };
  return { code: match[1], title: match[2] };
}

// Tooltip flotante genérico, mismo patrón que el de IconButton (Sidebar):
// se posiciona con getBoundingClientRect + createPortal a document.body
// para no quedar recortado por overflow-hidden de contenedores padres, y
// usa el mismo estilo visual (fondo blanco, borde celeste, texto #6B9BAE).
// A diferencia de un `title` nativo, este SÍ se ve consistente en toda la
// app y aparece con una pequeña demora al dejar el cursor quieto.
type TooltipPosition = "top" | "bottom" | "left" | "right";

const TOOLTIP_SHOW_DELAY = 250;

function HoverLabel({
  label,
  children,
  position = "top",
}: {
  label: string;
  children: ReactNode;
  position?: TooltipPosition;
}) {
  const [hovered, setHovered] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updatePosition = () => {
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return;

    const gap = 6;
    let top = 0;
    let left = 0;

    switch (position) {
      case "top":
        top = rect.top - gap;
        left = rect.left + rect.width / 2;
        break;
      case "bottom":
        top = rect.bottom + gap;
        left = rect.left + rect.width / 2;
        break;
      case "left":
        top = rect.top + rect.height / 2;
        left = rect.left - gap;
        break;
      case "right":
        top = rect.top + rect.height / 2;
        left = rect.right + gap;
        break;
    }

    setCoords({ top, left });
  };

  const handleEnter = () => {
    timeoutRef.current = setTimeout(() => {
      updatePosition();
      setHovered(true);
    }, TOOLTIP_SHOW_DELAY);
  };

  const handleLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setHovered(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const transformMap: Record<TooltipPosition, string> = {
    top: "translate(-50%, -100%)",
    bottom: "translate(-50%, 0)",
    left: "translate(-100%, -50%)",
    right: "translate(0, -50%)",
  };

  const arrowClassMap: Record<TooltipPosition, string> = {
    top: "absolute top-full left-1/2 -ml-1 -mt-1 h-2 w-2 rotate-45 bg-white border-r border-b border-[#D9EEF8]",
    bottom: "absolute bottom-full left-1/2 -ml-1 -mb-1 h-2 w-2 rotate-45 bg-white border-l border-t border-[#D9EEF8]",
    left: "absolute left-full top-1/2 -mt-1 -ml-1 h-2 w-2 rotate-45 bg-white border-r border-t border-[#D9EEF8]",
    right: "absolute right-full top-1/2 -mt-1 -mr-1 h-2 w-2 rotate-45 bg-white border-l border-b border-[#D9EEF8]",
  };

  return (
    <span
      ref={wrapperRef}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      className="inline-flex min-w-0"
    >
      {children}

      {hovered &&
        typeof document !== "undefined" &&
        createPortal(
          <span
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              transform: transformMap[position],
              zIndex: 9999,
            }}
            className="rounded-md bg-white border border-[#D9EEF8] px-2 py-1 text-[10px] font-medium text-[#6B9BAE] shadow-sm whitespace-nowrap pointer-events-none"
          >
            {label}
            <span className={arrowClassMap[position]} />
          </span>,
          document.body
        )}
    </span>
  );
}

function parseMeta(item: any) {
  // Nombre del convenio: el backend lo manda como `convenio_name`
  // (snake_case) en /api/v1/search. Se mantienen los fallbacks viejos
  // (`convenioName`, `name`) por si otro origen de datos todavía los usa.
  const backendConvenioName = item.convenio_name ?? item.convenioName ?? item.name;

  // Si el backend manda campos propios ya separados, se usan directo.
  if (item.code || item.portfolio || item.company || item.price) {
    return {
      code: item.code,
      portfolio: item.portfolio,
      company: item.company,
      price: item.price,
      convenioName: backendConvenioName,
    };
  }
  if (!item.details) {
    return {
      code: undefined,
      portfolio: undefined,
      company: undefined,
      price: undefined,
      convenioName: backendConvenioName,
    };
  }

  const raw = String(item.details);

  // Saca el precio primero, sin importar si viene como "$0" suelto o como
  // "... - $627,200.00" al final, para no confundirlo con el resto de partes.
  const priceMatch = raw.match(/\$[\d.,]+/);
  const price = priceMatch?.[0];
  const withoutPrice = raw.replace(/\s*-?\s*\$[\d.,]+\s*$/, "").trim();

  const parts = withoutPrice
    .split(/[·•]/)
    .map((p) => p.trim())
    .filter(Boolean);

  // Formato con etiquetas (convenios): "Código: X · Portafolio: Y · Empresa: Z"
  const hasLabels = parts.some((p) => p.includes(":"));
  if (hasLabels) {
    let code: string | undefined;
    let portfolio: string | undefined;
    let company: string | undefined;
    let convenioName: string | undefined;

    for (const part of parts) {
      const colonIndex = part.indexOf(":");
      if (colonIndex === -1) continue;
      const label = stripAccents(part.slice(0, colonIndex).trim().toLowerCase());
      const value = part.slice(colonIndex + 1).trim();
      if (!value) continue;

      if (label.includes("codigo")) code = value;
      else if (label.includes("portafolio")) portfolio = value;
      else if (label.includes("empresa")) company = value;
      // Por si el backend llega a mandar una etiqueta "Convenio: ..." explícita.
      else if (label.includes("convenio")) convenioName = value;
    }
    return { code, portfolio, company, price, convenioName: convenioName ?? backendConvenioName };
  }

  // Formato sin etiquetas (procedimientos): "EMPRESA · PORTAFOLIO"
  // primer segmento = empresa que paga, segundo = portafolio/convenio.
  // El nombre del convenio en sí NO viene en este string -> se toma del
  // campo propio `item.convenio_name` que manda el backend aparte.
  const [company, portfolio] = parts;
  return { code: undefined, portfolio, company, price, convenioName: backendConvenioName };
}

// Compara texto ignorando tildes y mayúsculas, para que "compensar" matchee
// "COMPENSAR" o "Compénsar".
const normalize = (s: string) => stripAccents(String(s ?? "")).toLowerCase();


// Indicador de carga tipo "escribiendo...": el texto + 3 puntos que rebotan
// con un pequeño desfase entre ellos, para que se vea como una ola.
function SearchingIndicator({ label = "Buscando" }: { label?: string }) {
  return (
    <div className="p-4 flex items-center justify-center gap-2 text-xs text-slate-400">
      <span>{label}</span>
      <span className="flex items-end gap-0.5 h-3">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.3s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.15s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
      </span>
    </div>
  );
}

/**
 * Buscador global único (especificación §5): un solo cuadro, dos tipos de resultado,
 * siempre remite a una ficha existente, nunca a una tercera vista.
 * - Código numérico de CUPS -> ficha de Procedimientos con ese código.
 * - Texto -> lista corta agrupada "Convenios" / "Procedimientos", tolerante a errores de tipeo.
 * Se usa tal cual en el header (variant="compact") y en Inicio (variant="hero")
 * para no mantener dos implementaciones del mismo comportamiento.
 */
export function GlobalSearch({
  variant = "compact",
  query,
  onQueryChange,
  placeholder,
  autoFocus,
  className = "",
}: GlobalSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { results, isLoading, isPending, isLoadingMore, isOpen, setIsOpen, hasMore, loadMore } = useSearch(query);
  const { hasPermission, loading: permsLoading } = usePermissions();
  const router = useRouter();

  // Fila expandida en el desplegable (por id). Al hacer clic, la fila crece
  // un poco hacia abajo y muestra la info completa sin truncar + el botón
  // para ir a la ficha, en vez de saltar directo o abrir un modal encima.
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!expandedId) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpandedId(null);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [expandedId]);

  useEffect(() => {
    if (!autoFocus) return;
    const isCmdK = (e: KeyboardEvent) => e.key === "k" && (e.ctrlKey || e.metaKey);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCmdK(e)) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        inputRef.current?.blur();
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [autoFocus, setIsOpen]);

  const filteredResults = useMemo(() => {
    if (permsLoading) return [];
    return results.filter((item: any) => {
      if (item.type === "Convenio") return hasPermission("view_companies");
      if (item.type === "Procedimiento") return hasPermission("procedures:view");
      return true;
    });
  }, [results, hasPermission, permsLoading]);

    const groups = useMemo(() => {
    const convenios = filteredResults.filter((r: any) => r.type === "Convenio");
    const procedimientos = filteredResults.filter((r: any) => r.type === "Procedimiento");
    return { convenios, procedimientos };
  }, [filteredResults]);

  const clearSearch = () => {
    onQueryChange("");
    inputRef.current?.focus();
  };

  const handleQueryChange = (value: string) => {
    onQueryChange(value);
    if (value.trim().length > 0) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter" || query.trim().length === 0) return;

    const trimmed = query.trim();
    if (CUPS_PATTERN.test(trimmed) && hasPermission("procedures:view")) {
      router.push(`/procedimientos/${encodeURIComponent(trimmed)}`);
    } else if (hasPermission("procedures:view")) {
      router.push(`/procedures?q=${encodeURIComponent(trimmed)}`);
    }
    setIsOpen(false);
  };

  const handleNavigation = (item: any) => {
    if (item.type === "Convenio" && !hasPermission("view_companies")) return;
    if (item.type === "Procedimiento" && !hasPermission("procedures:view")) return;

    router.push(item.route); // ya viene armado desde el backend
    setIsOpen(false);
    setExpandedId(null);
    onQueryChange("");
  };

  // dispara loadMore cuando el usuario llega casi al fondo del desplegable,
  // en vez de traer todo de una para no sobrecargar página/BD
  const handleDropdownScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (nearBottom) loadMore();
  };

  const isHero = variant === "hero";

  const renderResultRow = (item: any) => {
    const isConvenio = item.type === "Convenio";
    const { code: metaCode, portfolio, company, price, convenioName } = parseMeta(item);
    const estado = item.estado as "sin_tarifario" | "pendiente_digitacion" | undefined;

    // El código puede venir como campo propio (metaCode) o pegado al
    // inicio del título ("088402 SUTURA..."). Si viene en el título, se
    // saca de ahí para mostrarlo como badge y no repetirlo en el texto.
    const { code: titleCode, title: displayTitle } = extractCodeFromTitle(String(item.title ?? ""));
    const code = metaCode ?? titleCode;

    const isExpanded = expandedId === item.id;
    const canNavigate = isConvenio ? hasPermission("view_companies") : hasPermission("procedures:view");

    return (
      <div
        key={item.id}
        className={`rounded-lg transition-colors ${isExpanded ? "bg-slate-50" : "hover:bg-slate-50"}`}
      >
        <div
          onClick={() => setExpandedId(isExpanded ? null : item.id)}
          className="p-3 cursor-pointer flex items-start gap-3"
        >
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              isConvenio ? "bg-primary/10 text-primary" : "bg-green/10 text-green"
            }`}
          >
            {isConvenio ? <Building2 size={17} /> : <Stethoscope size={17} />}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[13px] font-semibold text-navy truncate">{displayTitle}</span>
                {/* Spec §5: si el convenio está sin tarifario o pendiente, se avisa antes del click */}
                {estado === "sin_tarifario" && (
                  <span className="shrink-0 text-[10px] font-semibold text-rose-600 bg-rose-50 rounded-full px-2 py-0.5">
                    Sin tarifario
                  </span>
                )}
                {estado === "pendiente_digitacion" && (
                  <span className="shrink-0 text-[10px] font-semibold text-amber-600 bg-amber-50 rounded-full px-2 py-0.5">
                    Pendiente digitación
                  </span>
                )}
              </div>

              {/* Precio: siempre en verde y en negrita, va aparte del resto de
                  datos (no reemplaza ni tapa código/portafolio/empresa). */}
              {price && (
                <span className="shrink-0 text-[12px] font-bold text-emerald-600">
                  {formatPrice(price)}
                </span>
              )}
            </div>

            {/* Cada dato tiene su propio color/ícono fijo en toda la app:
                gris = código, morado = empresa, índigo = nombre del convenio,
                azul = portafolio.
                Se muestra siempre que exista el dato, sin importar si
                también hay precio arriba. */}
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {code && (
                <HoverLabel label="Código">
                  <span className="flex items-center gap-1 shrink-0 text-[10px] font-mono font-semibold text-slate-600 bg-slate-100 rounded-full px-2 py-0.5">
                    <Hash size={10} />
                    {code}
                  </span>
                </HoverLabel>
              )}
              {company && (
                <HoverLabel label={`Empresa: ${company}`}>
                  <span className="flex items-center gap-1 min-w-0 max-w-[180px] text-[10px] font-medium text-purple-600 bg-purple-50 rounded-full px-2 py-0.5">
                    <Briefcase size={10} className="shrink-0" />
                    <span className="truncate">{company}</span>
                  </span>
                </HoverLabel>
              )}
              {/* Nombre del convenio: va antes que el portafolio. Ya viene
                  del campo propio `item.convenio_name` que manda el backend
                  para resultados de tipo Procedimiento. */}
              {convenioName && (
                <HoverLabel label={`Convenio: ${convenioName}`}>
                  <span className="flex items-center gap-1 min-w-0 max-w-[180px] text-[10px] font-medium text-indigo-600 bg-indigo-50 rounded-full px-2 py-0.5">
                    <FileText size={10} className="shrink-0" />
                    <span className="truncate">{convenioName}</span>
                  </span>
                </HoverLabel>
              )}
              {portfolio && (
                <HoverLabel label={`Portafolio: ${portfolio}`}>
                  <span className="flex items-center gap-1 min-w-0 max-w-[180px] text-[10px] font-medium text-blue-600 bg-blue-50 rounded-full px-2 py-0.5">
                    <Layers size={10} className="shrink-0" />
                    <span className="truncate">{portfolio}</span>
                  </span>
                </HoverLabel>
              )}

              {/* Fallback: si no se pudo reconocer ningún campo, se muestra
                  el texto crudo tal cual venga. */}
              {!code && !portfolio && !company && !convenioName && item.details && (
                <HoverLabel label={item.details}>
                  <span className="truncate text-[11px] text-slate-500">{item.details}</span>
                </HoverLabel>
              )}
            </div>
          </div>

          {/* Punto de estado: verde si activo, rojo si inactivo. El texto
              "Activo"/"Inactivo" ya no va como title nativo, sino como
              tooltip flotante (ver <HoverLabel>) para que se vea con el
              mismo estilo que el resto de la app. */}
          <HoverLabel label={item.is_active === false ? "Inactivo" : "Activo"} position="top">
            <span
              className={`shrink-0 mt-0.5 w-2 h-2 rounded-full ${
                item.is_active === false ? "bg-rose-500" : "bg-emerald-500"
              }`}
            />
          </HoverLabel>
        </div>

        {/* Panel expandible: usamos el truco de grid-template-rows 0fr -> 1fr
            para animar el alto sin conocerlo de antemano (funciona mejor que
            max-height, que hay que adivinarlo a mano). */}
        <div
          className={`grid transition-[grid-template-rows] duration-200 ease-out ${
            isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="overflow-hidden">
            <div className="px-3 pb-3 pl-[3.25rem] pt-1 space-y-2">
              {/* Texto completo, sin truncar, de lo que en la fila de arriba
                  va cortado con "truncate" por el ancho del badge. */}
              {company && (
                <div className="flex items-start gap-1.5 text-[12px]">
                  <span className="text-slate-400 shrink-0">Empresa:</span>
                  <span className="text-navy font-medium">{company}</span>
                </div>
              )}
              {convenioName && (
                <div className="flex items-start gap-1.5 text-[12px]">
                  <span className="text-slate-400 shrink-0">Convenio:</span>
                  <span className="text-navy font-medium">{convenioName}</span>
                </div>
              )}
              {portfolio && (
                <div className="flex items-start gap-1.5 text-[12px]">
                  <span className="text-slate-400 shrink-0">Portafolio:</span>
                  <span className="text-navy font-medium">{portfolio}</span>
                </div>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNavigation(item);
                }}
                disabled={!canNavigate}
                className="cursor-pointer mt-1 flex items-center gap-1.5 text-[12px] font-semibold text-primary hover:text-primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Ir a la ficha del {isConvenio ? "convenio" : "procedimiento"}
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`relative w-full ${className}`}>
      <div
        className={
          isHero
            ? "flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-5 py-3.5 shadow-sm focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10 transition-all"
            : "flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 w-full focus-within:border-primary/40 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/10 transition-all"
        }
      >
        <Search size={isHero ? 18 : 16} className="text-primary shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onKeyDown={handleSearch}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          onFocus={() => query.length > 0 && setIsOpen(true)}
          placeholder={placeholder ?? "Buscar convenios, tarifas o procedimientos..."}
          className={
            isHero
              ? "flex-1 outline-none text-sm text-navy placeholder:text-slate-400"
              : "flex-1 bg-transparent text-[13px] text-navy placeholder:text-slate-400 outline-none"
          }
        />

        {query.length > 0 ? (
          <button
            type="button"
            onClick={clearSearch}
            className="cursor-pointer p-1 hover:bg-primary/10 rounded-full transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5 text-slate-400" />
          </button>
        ) : (
          <kbd
            className={
              isHero
                ? "text-[10px] text-slate-400 bg-slate-50 border border-slate-200 rounded-md px-2 py-1 shrink-0"
                : "flex items-center gap-1 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[10px] font-mono text-primary-dark shrink-0"
            }
          >
            Ctrl + K
          </kbd>
        )}
      </div>

      {isOpen && query.length > 0 && !isPending && (
        <div
          onScroll={handleDropdownScroll}
          onMouseDown={(e) => e.preventDefault()}
          className="absolute top-full mt-2 w-full bg-white border border-slate-100 rounded-xl shadow-lg p-2 max-h-96 overflow-y-auto z-[100] text-left"
        >
          {isLoading || permsLoading ? (
            <SearchingIndicator />
          ) : filteredResults.length > 0 ? (
            <>
              {groups.convenios.length > 0 && (
                <div className="mb-1">
                  <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Convenios
                  </p>
                  {groups.convenios.map(renderResultRow)}
                </div>
              )}
              {groups.procedimientos.length > 0 && (
                <div>
                  <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Procedimientos
                  </p>
                  {groups.procedimientos.map(renderResultRow)}
                </div>
              )}

              {isLoadingMore && (
                <div className="p-3 flex items-center justify-center gap-2 text-xs text-slate-400">
                  <span>Cargando</span>
                  <span className="flex items-end gap-0.5 h-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                  </span>
                </div>
              )}

              {!hasMore && !isLoadingMore && filteredResults.length >= PAGE_SIZE_HINT && (
                <div className="p-2 text-center text-[11px] text-slate-300">No hay más resultados</div>
              )}
            </>
          ) : (
            <div className="p-4 text-center text-xs text-slate-400">
              No se encontraron coincidencias para "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}