"use client";

import { useRef, useEffect } from "react";
import { Search, Stethoscope, X, Hash, ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSearch } from "@/hooks/useSearch";

// Un código CUPS real siempre es numérico (ver especificación §5: "470201", "097100").
const CUPS_PATTERN = /^\d{4,6}$/;
const PAGE_SIZE_HINT = 8;

type GlobalSearchProps = {
  variant?: "hero" | "compact";
  query: string;
  onQueryChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
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
    <span className="inline-flex items-center gap-1 shrink-0 text-[10px] font-mono font-bold tracking-wide text-cyan-700 bg-cyan-50 border border-cyan-100 rounded-full px-2 py-0.5">
      <Hash size={10} />
      {code}
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
 * Buscador global (solo Procedimientos): código numérico -> ficha directa,
 * texto -> lista corta con paginación.
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

  const filteredResults = results.filter((item: any) => item.type === "Procedimiento");

  const clearSearch = () => {
    onQueryChange("");
    inputRef.current?.focus();
  };

  const handleQueryChange = (value: string) => {
    onQueryChange(value);
    setIsOpen(value.trim().length > 0);
  };

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter" || query.trim().length === 0) return;

    const trimmed = query.trim();
    if (CUPS_PATTERN.test(trimmed)) {
      router.push(`/procedimientos/${encodeURIComponent(trimmed)}`);
    } else {
      router.push(`/procedures?q=${encodeURIComponent(trimmed)}`);
    }
    setIsOpen(false);
  };

  const handleNavigation = (item: any) => {
    router.push(item.route);
    setIsOpen(false);
    onQueryChange("");
  };

  const handleDropdownScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (nearBottom) loadMore();
  };

  const isHero = variant === "hero";

  const renderResultRow = (item: any) => {
    const { code, title: displayTitle } = extractCodeFromTitle(String(item.title ?? ""));
    return (
      <div
        key={item.id}
        onClick={() => handleNavigation(item)}
        className="rounded-lg transition-colors p-3 flex items-center gap-3 cursor-pointer hover:bg-slate-50"
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-emerald-500 text-white">
          <Stethoscope size={17} />
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <span className="text-[13px] font-semibold text-navy truncate leading-tight">{displayTitle}</span>
          {code && <CodeChip code={code} />}
        </div>
        <ArrowRight size={14} className="text-slate-300 shrink-0" />
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
          placeholder={placeholder ?? "Buscar procedimientos por nombre o código..."}
          className={
            isHero
              ? "flex-1 outline-none text-sm text-navy placeholder:text-slate-400"
              : "flex-1 bg-transparent text-[13px] text-navy placeholder:text-slate-400 outline-none"
          }
        />
        {query.length > 0 ? (
          <button type="button" onClick={clearSearch} className="cursor-pointer p-1 hover:bg-primary/10 rounded-full transition-colors shrink-0">
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
          {isLoading ? (
            <SearchingIndicator />
          ) : filteredResults.length > 0 ? (
            <>
              {filteredResults.map(renderResultRow)}
              {isLoadingMore && (
                <div className="p-3 flex items-center justify-center gap-2 text-xs text-slate-400">
                  <Loader2 size={12} className="animate-spin" />
                  <span>Cargando</span>
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