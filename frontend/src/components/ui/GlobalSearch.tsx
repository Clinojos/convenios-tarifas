"use client";

import { useRef, useMemo, useEffect, useState } from "react";
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

function parseMeta(item: any) {
  // Si el backend manda campos propios ya separados, se usan directo.
  if (item.code || item.portfolio || item.company || item.price) {
    return {
      code: item.code,
      portfolio: item.portfolio,
      company: item.company,
      price: item.price,
      // NOTA: asumo que el backend puede mandar el nombre del convenio en
      // `convenioName` (o, si no, `name`). Si el campo real se llama distinto,
      // avísame y cambio esta línea.
      convenioName: item.convenioName ?? item.name,
    };
  }
  if (!item.details) {
    return { code: undefined, portfolio: undefined, company: undefined, price: undefined, convenioName: undefined };
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
    return { code, portfolio, company, price, convenioName: convenioName ?? item.convenioName ?? item.name };
  }

  // Formato sin etiquetas (procedimientos): "EMPRESA · PORTAFOLIO"
  // primer segmento = empresa que paga, segundo = portafolio/convenio.
  const [company, portfolio] = parts;
  return { code: undefined, portfolio, company, price, convenioName: undefined };
}

// Compara texto ignorando tildes y mayúsculas, para que "compensar" matchee
// "COMPENSAR" o "Compénsar".
const normalize = (s: string) => stripAccents(String(s ?? "")).toLowerCase();

// Reordena los resultados de un grupo (convenios o procedimientos) para que
// los que coincidan por empresa/portafolio/título con lo que el usuario
// escribió salgan primero. No toca el orden que ya trae cada subgrupo entre
// sí (sort estable), solo separa "coincide" de "no coincide".
// OJO: esto es un reordenamiento en el frontend sobre lo que ya devolvió el
// backend en esa página de resultados; si el backend pagina (offset/limit),
// esto NO reordena contra resultados que todavía no se han cargado.
function prioritizeByCompanyMatch<T>(items: T[], query: string): T[] {
  const q = normalize(query);
  if (!q) return items;

  const matches: T[] = [];
  const rest: T[] = [];

  for (const item of items) {
    const { company, portfolio, convenioName } = parseMeta(item);
    const title = String((item as any).title ?? "");
    const haystack = normalize(`${company ?? ""} ${portfolio ?? ""} ${convenioName ?? ""} ${title}`);
    if (haystack.includes(q)) {
      matches.push(item);
    } else {
      rest.push(item);
    }
  }
  return [...matches, ...rest];
}

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
  const { results, isLoading, isLoadingMore, isOpen, setIsOpen, hasMore, loadMore } = useSearch(query);
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
    return {
      convenios: prioritizeByCompanyMatch(convenios, query),
      procedimientos: prioritizeByCompanyMatch(procedimientos, query),
    };
  }, [filteredResults, query]);

  const clearSearch = () => {
    onQueryChange("");
    inputRef.current?.focus();
  };

  // FIX: antes, esto solo llamaba a onQueryChange y dependía de que `isOpen`
  // (que viene del hook useSearch) cambiara por su cuenta. Si la primera vez
  // que se hacía focus el query estaba vacío, `onFocus` nunca abría el
  // desplegable, y como aquí tampoco se forzaba `setIsOpen(true)`, la
  // primera búsqueda se quedaba "muda" hasta salir y volver a entrar al
  // input (ahí sí `onFocus` encontraba `query.length > 0`).
  // Ahora abrimos el desplegable apenas hay texto, sin depender de un
  // focus/blur previo.
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
                <span
                  className="flex items-center gap-1 shrink-0 text-[10px] font-mono font-semibold text-slate-600 bg-slate-100 rounded-full px-2 py-0.5"
                  title="Código"
                >
                  <Hash size={10} />
                  {code}
                </span>
              )}
              {company && (
                <span
                  className="flex items-center gap-1 min-w-0 max-w-[180px] text-[10px] font-medium text-purple-600 bg-purple-50 rounded-full px-2 py-0.5"
                  title={`Empresa: ${company}`}
                >
                  <Briefcase size={10} className="shrink-0" />
                  <span className="truncate">{company}</span>
                </span>
              )}
              {/* Nombre del convenio: va antes que el portafolio.
                  OJO: revisar que `convenioName` mapee al campo real que
                  manda el backend (ver nota en parseMeta). */}
              {convenioName && (
                <span
                  className="flex items-center gap-1 min-w-0 max-w-[180px] text-[10px] font-medium text-indigo-600 bg-indigo-50 rounded-full px-2 py-0.5"
                  title={`Convenio: ${convenioName}`}
                >
                  <FileText size={10} className="shrink-0" />
                  <span className="truncate">{convenioName}</span>
                </span>
              )}
              {portfolio && (
                <span
                  className="flex items-center gap-1 min-w-0 max-w-[180px] text-[10px] font-medium text-blue-600 bg-blue-50 rounded-full px-2 py-0.5"
                  title={`Portafolio: ${portfolio}`}
                >
                  <Layers size={10} className="shrink-0" />
                  <span className="truncate">{portfolio}</span>
                </span>
              )}

              {/* Fallback: si no se pudo reconocer ningún campo, se muestra
                  el texto crudo tal cual venga. */}
              {!code && !portfolio && !company && !convenioName && item.details && (
                <span className="truncate text-[11px] text-slate-500" title={item.details}>
                  {item.details}
                </span>
              )}
            </div>
          </div>

          <span
            className={`shrink-0 mt-0.5 w-2 h-2 rounded-full ${isConvenio ? "bg-primary" : "bg-green"}`}
            title={item.type}
          />
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

      {isOpen && query.length > 0 && (
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