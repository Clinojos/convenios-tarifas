"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { Search, Stethoscope, Building2, X, Hash, Layers, Briefcase, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSearch } from "@/hooks/useSearch";
import { usePermissions } from "@/hooks/usePermissions";

export function Header() {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { results, isLoading, isLoadingMore, isOpen, setIsOpen, hasMore, loadMore } = useSearch(query);
  const { hasPermission, loading: permsLoading } = usePermissions();
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.ctrlKey || e.metaKey;

      if (e.key === "k" && isCmdOrCtrl) {
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
  }, [setIsOpen]);

  const filteredResults = useMemo(() => {
    if (permsLoading) return [];
    return results.filter((item: any) => {
      if (item.type === "Convenio") return hasPermission("view_companies");
      if (item.type === "Procedimiento") return hasPermission("procedures:view");
      return true;
    });
  }, [results, hasPermission, permsLoading]);

  const clearSearch = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && query.length > 0) {
      if (hasPermission("procedures:view")) {
        router.push(`/procedures?q=${encodeURIComponent(query)}`);
      }
      setIsOpen(false);
    }
  };

  const handleNavigation = (item: any) => {
    if (item.type === "Convenio" && !hasPermission("view_companies")) return;
    if (item.type === "Procedimiento" && !hasPermission("procedures:view")) return;

    router.push(item.route); // ya viene armado desde el backend
    setIsOpen(false);
    setQuery("");
  };

  // dispara loadMore cuando el usuario llega casi al fondo del desplegable,
  // en vez de traer todo de una para no sobrecargar página/BD
  const handleDropdownScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (nearBottom) {
      loadMore();
    }
  };

  // El backend manda todo en un solo string:
  // "Código: 088001 · Portafolio: CAJA DE COMPENSACION COMPENSAR · Empresa: COMPENSAR EPS · $0"
  // Lo separamos por "·" y luego por ":" para poder mostrar cada dato con su propio icono
  // en vez de texto plano corrido.
  const stripAccents = (s: string) =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const parseMeta = (item: any) => {
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
  };

  return (
    <header className="relative h-14 bg-white border-b border-slate-100 flex items-center px-8 z-50">
      <div className="flex-1 flex justify-center max-w-3xl mx-auto w-full">
        <div className="relative w-full">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 w-full focus-within:border-primary/40 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/10 transition-all">
            <Search className="w-4 h-4 text-primary shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Buscar convenios, tarifas o procedimientos..."
              className="flex-1 bg-transparent text-[13px] text-navy placeholder:text-slate-400 outline-none"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleSearch}
              onBlur={() => setTimeout(() => setIsOpen(false), 200)}
              onFocus={() => {
                if (query.length > 0) setIsOpen(true);
              }}
            />

            <div className="flex items-center gap-1 shrink-0">
              {query.length > 0 ? (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="cursor-pointer p-1 hover:bg-primary/10 rounded-full transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-slate-400" />
                </button>
              ) : (
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[10px] font-mono text-primary-dark">
                  <span className="font-bold">Ctrl + K</span>
                </div>
              )}
            </div>
          </div>

          {/* DESPLEGABLE DINÁMICO */}
          {isOpen && query.length > 0 && (
            <div
              onScroll={handleDropdownScroll}
              className="absolute top-full mt-2 w-full bg-white border border-slate-100 rounded-xl shadow-lg p-2 max-h-96 overflow-y-auto z-[100]"
            >
              {isLoading || permsLoading ? (
                <div className="p-4 text-center text-xs text-slate-400">Buscando...</div>
              ) : filteredResults.length > 0 ? (
                <>
                  {filteredResults.map((item: any) => {
                    const isConvenio = item.type === "Convenio";
                    const { code, portfolio, company } = parseMeta(item);
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
                          <div className="text-[13px] font-semibold text-navy truncate">
                            {item.title}
                          </div>

                          {/* Metadatos con iconos en lugar de texto plano */}
                          <div className="mt-1 flex flex-col gap-0.5 text-[11px] text-slate-500">
                            <div className="flex items-center gap-3">
                              {code && (
                                <span className="flex items-center gap-1 shrink-0" title="Código">
                                  <Hash size={11} className="text-slate-400" />
                                  <span className="font-mono">{code}</span>
                                </span>
                              )}

                              {portfolio && (
                                <span
                                  className="flex items-center gap-1 min-w-0"
                                  title={`Portafolio: ${portfolio}`}
                                >
                                  <Layers size={11} className="text-slate-400 shrink-0" />
                                  <span className="truncate">{portfolio}</span>
                                </span>
                              )}
                            </div>

                            {company && (
                              <span
                                className="flex items-center gap-1 min-w-0"
                                title={`Empresa: ${company}`}
                              >
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

                        {/* Tag de tipo, ahora como acento a la derecha en vez de bloque de texto */}
                        <span
                          className={`shrink-0 mt-0.5 w-2 h-2 rounded-full ${
                            isConvenio ? "bg-primary" : "bg-green"
                          }`}
                          title={item.type}
                        />
                      </div>
                    );
                  })}

                  {isLoadingMore && (
                    <div className="p-3 flex items-center justify-center gap-2 text-xs text-slate-400">
                      <Loader2 size={13} className="animate-spin" />
                      Cargando más...
                    </div>
                  )}

                  {!hasMore && !isLoadingMore && filteredResults.length >= PAGE_SIZE_HINT && (
                    <div className="p-2 text-center text-[11px] text-slate-300">
                      No hay más resultados
                    </div>
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
      </div>
    </header>
  );
}

const PAGE_SIZE_HINT = 8;