"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { Search, Stethoscope, Building2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSearch } from "@/hooks/useSearch";
import { usePermissions } from "@/hooks/usePermissions";

export function Header() {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { results, isLoading, isOpen, setIsOpen } = useSearch(query);
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
    if (e.key === 'Enter' && query.length > 0) {
      if (hasPermission("procedures:view")) {
        router.push(`/procedures?q=${encodeURIComponent(query)}`);
      }
      setIsOpen(false);
    }
  };

  const handleNavigation = (item: any) => {
    if (item.type === "Convenio" && !hasPermission("view_companies")) return;
    if (item.type === "Procedimiento" && !hasPermission("procedures:view")) return;

    const route = item.type === "Convenio" ? "/companies" : "/procedures";
    router.push(`${route}?id=${item.id}&q=${encodeURIComponent(item.title)}`);
    setIsOpen(false);
    setQuery("");
  };

  return (
    <header className="relative h-[52px] bg-white border-b border-slate-100 flex items-center justify-between px-6 z-50">
      <div className="flex-1 flex justify-center max-w-xl mx-auto w-full px-4">
        <div className="relative w-full">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-4 py-1.5 w-full focus-within:border-primary/40 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/10 transition-all">
            <Search className="w-3.5 h-3.5 text-primary" />
            <input 
              ref={inputRef}
              type="text"
              placeholder="Buscar convenios, tarifas o procedimientos..."
              className="flex-1 bg-transparent text-[12px] text-navy placeholder:text-slate-400 outline-none"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleSearch}
              onBlur={() => setTimeout(() => setIsOpen(false), 200)}
              onFocus={() => { if (query.length > 0) setIsOpen(true); }}
            />

            <div className="flex items-center gap-1">
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
            <div className="absolute top-full mt-2 w-full bg-white border border-slate-100 rounded-xl shadow-lg p-2 max-h-80 overflow-y-auto z-[100]">
              {isLoading || permsLoading ? (
                <div className="p-4 text-center text-xs text-slate-400">Buscando...</div>
              ) : filteredResults.length > 0 ? (
                filteredResults.map((item: any) => (
                  <div 
                    key={item.id} 
                    onClick={() => handleNavigation(item)}
                    className="p-3 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors flex items-start gap-3"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.type === 'Convenio' ? 'bg-primary/10 text-primary' : 'bg-green/10 text-green'}`}>
                      {item.type === 'Convenio' ? <Building2 size={16} /> : <Stethoscope size={16} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold text-navy truncate">{item.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded font-bold text-[9px] uppercase tracking-wider ${item.type === 'Convenio' ? 'bg-primary/15 text-primary-dark' : 'bg-green/15 text-green'}`}>
                          {item.type}
                        </span>
                        {item.details && <span className="truncate">{item.details}</span>}
                      </div>
                    </div>
                  </div>
                ))
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