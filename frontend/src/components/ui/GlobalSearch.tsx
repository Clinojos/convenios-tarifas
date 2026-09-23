"use client";

import { useRef, useEffect, useState } from "react";
import { Search, Stethoscope, Building2, X, Hash, ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSearch } from "@/hooks/useSearch";
import { useConvenioSearch } from "@/hooks/useConvenioSearch";
import { registerConvenioVisit } from "@/hooks/useConvenios";

// Un código CUPS real siempre es numérico (ver especificación §5: "470201", "097100").
const CUPS_PATTERN = /^\d{4,6}$/;
const PAGE_SIZE_HINT = 8;
// Cuántos convenios que hicieron match mostramos como chip antes de
// colapsar el resto en un "+N más". Si mostramos todos (como con "sura"),
// la tarjeta se vuelve ilegible.
const MAX_VISIBLE_MATCHES = 2;

type GlobalSearchProps = {
  variant?: "hero" | "compact";
  query: string;
  onQueryChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
};

type Row =
  | { kind: "procedimiento"; key: string; item: any }
  | { kind: "convenio"; key: string; item: any };

// Nombres de campo del grupo de convenios. Si algun dato sale vacio en el
// desplegable, es el unico lugar donde hay que ajustar los nombres.
const convenioName = (g: any): string => g.display_name ?? g.name ?? g.company_name ?? g.group_key ?? "";
const convenioCompany = (g: any): string | undefined => {
  const company = g.company_name;
  return company && company !== convenioName(g) ? company : undefined;
};

// El título viene como "088402 SUTURA PROFUNDA DE HERIDA..." -> separamos
// el código del nombre para mostrarlos distinto (nombre arriba, chip abajo).
function extractCodeFromTitle(title: string): { code?: string; title: string } {
  const match = title.match(/^(\d{4,6})\s+(.+)$/);
  if (!match) return { title };
  return { code: match[1], title: match[2] };
}

function CodeChip({ code }: { code: string }) {
  return (
    <span className="inline-flex items-center gap-0.5 self-start shrink-0 text-[10px] font-semibold tabular-nums text-primary bg-primary/10 rounded-md px-1.5 py-0.5">
      <Hash size={10} />
      {code}
    </span>
  );
}

function StatusText({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 shrink-0 text-[11px] font-medium ${
        active ? "text-emerald-600" : "text-rose-500"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-rose-400"}`} />
      {active ? "Activo" : "Inactivo"}
    </span>
  );
}

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
 * Buscador global: procedimientos (por código o nombre) y convenios/empresas
 * en un solo desplegable, agrupados por tipo y con iconos distintos.
 * Numérico -> primero procedimientos; texto -> primero convenios.
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
  const listRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  const { results, isLoading, isPending, isLoadingMore, isOpen, setIsOpen, hasMore, loadMore } = useSearch(query);
  const { convenios, isLoading: convLoading, isPending: convPending } = useConvenioSearch(query);
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

  // Nueva busqueda -> se pierde la fila seleccionada con flechas.
  useEffect(() => setActiveIndex(-1), [query]);

  // Solo procedimientos vienen de /search; los convenios vienen del endpoint
  // de grupos (asi no se duplican si /search algun dia devuelve otros tipos).
  const procRows: Row[] = results
    .filter((item: any) => item.type === "Procedimiento")
    .map((item: any) => ({ kind: "procedimiento", key: `p-${item.id}`, item }));
  const convRows: Row[] = convenios.map((g: any) => ({ kind: "convenio", key: `c-${g.group_key}`, item: g }));

  const isNumeric = /^\d+$/.test(query.trim());
  const groups = (
    isNumeric
      ? [
          { title: "Procedimientos", rows: procRows },
          { title: "Convenios", rows: convRows },
        ]
      : [
          { title: "Convenios", rows: convRows },
          { title: "Procedimientos", rows: procRows },
        ]
  ).filter((g) => g.rows.length > 0);
  const flatRows = groups.flatMap((g) => g.rows);

  const pending = isPending || convPending;
  const loading = isLoading || convLoading;
  const dropdownVisible = isOpen && query.length > 0 && !pending;

  useEffect(() => {
    if (activeIndex < 0) return;
    listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const clearSearch = () => {
    onQueryChange("");
    inputRef.current?.focus();
  };

  const handleQueryChange = (value: string) => {
    onQueryChange(value);
    setIsOpen(value.trim().length > 0);
  };

  const finishNavigation = () => {
    setIsOpen(false);
    onQueryChange("");
  };

  // Mismas reglas que openConvenio en la pagina de Convenios: una sola
  // variante -> ficha directa (y se registra la visita); varias -> empresa.
  const openConvenio = (g: any) => {
    if ((g.total_variants ?? 1) <= 1) {
      const contractKey = g.variant_keys?.[0] ?? g.group_key;
      registerConvenioVisit(contractKey);
      router.push(`/convenios/${contractKey}`);
    } else {
      router.push(`/convenios/empresa/${g.group_key}`);
    }
  };

  const openRow = (row: Row) => {
    if (row.kind === "convenio") openConvenio(row.item);
    else router.push(row.item.route);
    finishNavigation();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (!dropdownVisible || flatRows.length === 0) return;
      e.preventDefault();
      setActiveIndex((prev) =>
        e.key === "ArrowDown" ? Math.min(prev + 1, flatRows.length - 1) : Math.max(prev - 1, 0)
      );
      return;
    }

    if (e.key !== "Enter" || query.trim().length === 0) return;

    // Con una fila seleccionada con flechas, Enter la abre.
    if (dropdownVisible && activeIndex >= 0 && flatRows[activeIndex]) {
      openRow(flatRows[activeIndex]);
      return;
    }

    const trimmed = query.trim();
    if (CUPS_PATTERN.test(trimmed)) {
      router.push(`/procedimientos/${encodeURIComponent(trimmed)}`);
    } else {
      router.push(`/procedures?q=${encodeURIComponent(trimmed)}`);
    }
    setIsOpen(false);
  };

  const handleDropdownScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (nearBottom) loadMore();
  };

  const isHero = variant === "hero";

  const renderRow = (row: Row, index: number) => {
    const active = index === activeIndex;
    const isConvenio = row.kind === "convenio";

    let title: string;
    let detail: React.ReactNode = null;
    let trailing: React.ReactNode = null;

    if (isConvenio) {
      const g = row.item;
      const company = convenioCompany(g);
      const variants = g.total_variants ?? 1;
      const allMatches: { contract_key: string; name: string }[] = g.matched_variants ?? [];
      const visibleMatches = allMatches.slice(0, MAX_VISIBLE_MATCHES);
      const hiddenCount = allMatches.length - visibleMatches.length;
      title = convenioName(g);

      detail = (
        <span className="flex items-center gap-1.5 min-w-0 flex-wrap text-[11px] text-slate-500">
          {company && <span className="truncate">{company}</span>}
          {visibleMatches.length > 0 ? (
            <>
              {visibleMatches.map((mv) => (
                <span
                  key={mv.contract_key}
                  className="relative group/chip inline-flex items-center h-5 gap-0.5 max-w-[9rem] shrink-0 leading-none text-[10px] font-semibold tabular-nums text-primary bg-primary/10 rounded-md px-1.5"
                >
                  <Hash size={10} className="shrink-0" />
                  <span className="shrink-0">{mv.contract_key}</span>
                  {mv.name && <span className="font-medium text-primary/80 truncate">· {mv.name}</span>}

                  {mv.name && (
                    <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 scale-0 transition-all rounded-md bg-white border border-[#D9EEF8] px-2 py-1 text-[10px] font-medium text-[#6B9BAE] shadow-sm group-hover/chip:scale-100 whitespace-nowrap z-50">
                      {mv.contract_key} · {mv.name}
                      <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 h-2 w-2 rotate-45 bg-white border-r border-b border-[#D9EEF8]" />
                    </span>
                  )}
                </span>
              ))}
              {hiddenCount > 0 && (
                <span className="inline-flex items-center h-5 shrink-0 rounded-md bg-slate-100 px-1.5 leading-none text-[10px] font-medium text-slate-500">
                  +{hiddenCount} más
                </span>
              )}
            </>
          ) : (
            variants > 1 && (
              <span className="inline-flex items-center h-5 shrink-0 rounded-md bg-slate-100 px-1.5 leading-none text-[10px] font-medium text-slate-500">
                {variants} convenios
              </span>
            )
          )}
        </span>
      );
      trailing = <StatusText active={g.status === "Activo"} />;
    } else {
      const { code, title: displayTitle } = extractCodeFromTitle(String(row.item.title ?? ""));
      title = displayTitle;
      detail = code ? <CodeChip code={code} /> : null;
    }

    return (
      <div
        key={row.key}
        role="option"
        aria-selected={active}
        data-index={index}
        onClick={() => openRow(row)}
        className={`rounded-lg transition-colors px-3 py-2.5 flex items-center gap-3 cursor-pointer hover:bg-slate-50 ${
          active ? "bg-slate-50" : ""
        }`}
      >
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white ${
            isConvenio ? "bg-navy" : "bg-primary"
          }`}
        >
          {isConvenio ? <Building2 size={16} /> : <Stethoscope size={16} />}
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <span title={title} className="text-[13px] font-semibold text-navy truncate leading-tight">
            {title}
          </span>
          {detail}
        </div>
        {trailing}
        <ArrowRight size={14} className={`shrink-0 transition-colors ${active ? "text-primary" : "text-slate-300"}`} />
      </div>
    );
  };

  let runningIndex = 0;

  return (
    <div className={`relative w-full ${className}`}>
      <div
        className={
          isHero
            ? "flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-5 py-3.5 shadow-sm focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10 transition-all"
            : "flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 w-full shadow-sm focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10 transition-all"
        }
      >
        <Search size={isHero ? 18 : 16} className="text-primary shrink-0" />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={dropdownVisible}
          aria-autocomplete="list"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          onFocus={() => query.length > 0 && setIsOpen(true)}
          placeholder={placeholder ?? "Busca un procedimiento, código CUPS o convenio..."}
          className={
            isHero
              ? "flex-1 outline-none text-sm text-navy placeholder:text-slate-400"
              : "flex-1 bg-transparent text-[13px] text-navy placeholder:text-slate-400 outline-none"
          }
        />
        {query.length > 0 ? (
          <button
            type="button"
            aria-label="Borrar búsqueda"
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

      {dropdownVisible && (
        <div
          ref={listRef}
          role="listbox"
          onScroll={handleDropdownScroll}
          onMouseDown={(e) => e.preventDefault()}
          className="absolute top-full mt-2 w-full bg-white border border-slate-200/70 rounded-2xl shadow-xl shadow-slate-900/5 p-2 max-h-[min(24rem,60vh)] overflow-y-auto z-[100] text-left"
        >
          {loading ? (
            <SearchingIndicator />
          ) : flatRows.length > 0 ? (
            <>
              {groups.map((group) => (
                <div key={group.title} className="mb-1 last:mb-0">
                  <p className="px-3 pt-2 pb-1 text-[11px] font-medium text-slate-400">{group.title}</p>
                  {group.rows.map((row) => renderRow(row, runningIndex++))}
                </div>
              ))}
              {isLoadingMore && (
                <div className="p-3 flex items-center justify-center gap-2 text-xs text-slate-400">
                  <Loader2 size={12} className="animate-spin" />
                  <span>Cargando</span>
                </div>
              )}
              {!hasMore && !isLoadingMore && procRows.length >= PAGE_SIZE_HINT && (
                <div className="p-2 text-center text-[11px] text-slate-300">No hay más resultados</div>
              )}
            </>
          ) : (
            <div className="p-4 text-center text-xs text-slate-400">
              No se encontraron coincidencias para «{query}». Prueba con el código o parte del nombre.
            </div>
          )}
        </div>
      )}
    </div>
  );
}