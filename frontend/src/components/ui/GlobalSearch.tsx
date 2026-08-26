"use client";

import { useRef, useMemo, useEffect } from "react";
import { Search, Stethoscope, Building2, X, Hash, Layers, Briefcase, Loader2 } from "lucide-react";
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

// El backend manda todo en un solo string:
// "Código: 088001 · Portafolio: CAJA DE COMPENSACION COMPENSAR · Empresa: COMPENSAR EPS · $0"
// Lo separamos por "·" y luego por ":" para poder mostrar cada dato con su propio icono
// en vez de texto plano corrido.
const stripAccents = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

function parseMeta(item: any) {
  // Si en algún momento el backend empieza a mandar campos propios, se usan directo
  if (item.code || item.portfolio || item.company) {
    return { code: item.code, portfolio: item.portfolio, company: item.company };
  }
  if (!item.details) return { code: undefined, portfolio: undefined, company: undefined };

  const parts = String(item.details)
    .split(/[·•]/)
    .map((p: string) => p.trim())
    .filter(Boolean);

  let code: string | undefined;
  let portfolio: string | undefined;
  let company: string | undefined;

  for (const part of parts) {
    const colonIndex = part.indexOf(":");
    if (colonIndex === -1) continue; // ej: "$0", sin etiqueta, se ignora

    const label = stripAccents(part.slice(0, colonIndex).trim().toLowerCase());
    const value = part.slice(colonIndex + 1).trim();
    if (!value) continue;

    if (label.includes("codigo")) code = value;
    else if (label.includes("portafolio")) portfolio = value;
    else if (label.includes("empresa")) company = value;
  }

  return { code, portfolio, company };
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
    return {
      convenios: filteredResults.filter((r: any) => r.type === "Convenio"),
      procedimientos: filteredResults.filter((r: any) => r.type === "Procedimiento"),
    };
  }, [filteredResults]);

  const clearSearch = () => {
    onQueryChange("");
    inputRef.current?.focus();
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
    const { code, portfolio, company } = parseMeta(item);
    const estado = item.estado as "sin_tarifario" | "pendiente_digitacion" | undefined;

    return (
      <div
        key={item.id}
        onClick={() => handleNavigation(item)}
        className="p-3 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors flex items-start gap-3"
      >
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
            isConvenio ? "bg-primary/10 text-primary" : "bg-green/10 text-green"
          }`}
        >
          {isConvenio ? <Building2 size={17} /> : <Stethoscope size={17} />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-navy truncate">{item.title}</span>
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

          <div className="mt-1 flex flex-col gap-0.5 text-[11px] text-slate-500">
            <div className="flex items-center gap-3">
              {code && (
                <span className="flex items-center gap-1 shrink-0" title="Código">
                  <Hash size={11} className="text-slate-400" />
                  <span className="font-mono">{code}</span>
                </span>
              )}
              {portfolio && (
                <span className="flex items-center gap-1 min-w-0" title={`Portafolio: ${portfolio}`}>
                  <Layers size={11} className="text-slate-400 shrink-0" />
                  <span className="truncate">{portfolio}</span>
                </span>
              )}
            </div>

            {company && (
              <span className="flex items-center gap-1 min-w-0" title={`Empresa: ${company}`}>
                <Briefcase size={11} className="text-slate-400 shrink-0" />
                <span className="truncate">{company}</span>
              </span>
            )}

            {!code && !portfolio && !company && item.details && (
              <span className="truncate" title={item.details}>
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
          onChange={(e) => onQueryChange(e.target.value)}
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
          className="absolute top-full mt-2 w-full bg-white border border-slate-100 rounded-xl shadow-lg p-2 max-h-96 overflow-y-auto z-[100] text-left"
        >
          {isLoading || permsLoading ? (
            <div className="p-4 text-center text-xs text-slate-400">Buscando...</div>
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
                  <Loader2 size={13} className="animate-spin" />
                  Cargando más...
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