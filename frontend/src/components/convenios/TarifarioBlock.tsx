"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Layers, ChevronLeft, ChevronRight } from "lucide-react";
import { useTarifario } from "@/hooks/useTarifario";

function formatCOP(valor: number) {
  return valor.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

interface TarifarioBlockProps {
  contractKey: string;
  // Se llama con la cantidad de portafolios apenas se resuelve el fetch,
  // para que ConvenioHeader pueda mostrar "N portafolios" en el badge.
  onPortfoliosChange?: (count: number) => void;
  // Llegan desde el buscador global (ver page.tsx): si el usuario clickeó
  // un resultado de tipo "Procedimiento", acá viene en qué portafolio está
  // y qué código hay que resaltar/llevar a la vista.
  initialPortfolio?: string;
  highlightCode?: string;
}

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
    limit,
    loadingItems,
    error,
    fetchPortfolios,
    fetchItems,
  } = useTarifario(contractKey);

  const [activePortfolio, setActivePortfolio] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Fila que hay que resaltar/scrollear cuando se llega desde el buscador.
  // didScrollRef evita que el scroll se repita en cada render; se resetea
  // cuando llega un highlightCode nuevo (el usuario buscó otro procedimiento
  // sin salir de este convenio, ver efecto 1).
  const highlightRowRef = useRef<HTMLTableRowElement | null>(null);
  const didScrollRef = useRef(false);

  // 1. Al montar (o si cambia el convenio, o llega un highlight nuevo desde
  // el buscador global), trae los portafolios reales del convenio.
  useEffect(() => {
    didScrollRef.current = false; // nuevo highlight -> permitir scroll de nuevo

    fetchPortfolios().then((data) => {
      if (data.length > 0) {
        const target =
          initialPortfolio && data.some((p) => p.code === initialPortfolio)
            ? initialPortfolio
            : data[0].code;

        if (target === activePortfolio) {
          // Ya estábamos en ese portafolio (típico: el usuario busca otro
          // procedimiento del mismo tab). Como el portafolio activo no
          // cambia, el efecto 2 no se dispara solo, así que forzamos
          // el fetch acá con el nuevo código a resaltar.
          fetchItems(target, highlightCode || undefined, 1);
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
  // Si venimos del buscador, precargamos el search con el código a
  // resaltar para que la fila caiga sí o sí dentro de la página 1.
  useEffect(() => {
    if (!activePortfolio) return;
    if (highlightCode && !didScrollRef.current) {
      setSearch(highlightCode);
    } else {
      fetchItems(activePortfolio, search || undefined, 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePortfolio]);

  // 3. Búsqueda con debounce simple, siempre vuelve a la página 1
  useEffect(() => {
    if (!activePortfolio) return;
    const timeout = setTimeout(
      () => fetchItems(activePortfolio, search || undefined, 1),
      350,
    );
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // 4. Cuando llegan los items y hay un código para resaltar, hace scroll
  // suave hasta la fila la primera vez que aparece.
  useEffect(() => {
    if (!highlightCode || didScrollRef.current) return;
    const found = items.some((item) => item.proc_code === highlightCode);
    if (found && highlightRowRef.current) {
      highlightRowRef.current.scrollIntoView({ block: "center", behavior: "smooth" });
      didScrollRef.current = true;
    }
  }, [items, highlightCode]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const goToPage = (newPage: number) => {
    if (!activePortfolio) return;
    if (newPage < 1 || newPage > totalPages) return;
    fetchItems(activePortfolio, search || undefined, newPage);
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4">
      {portfolios.length > 0 && (
        <div className="flex items-center gap-1.5 -mx-4 px-4">
          <Layers size={13} className="text-slate-300 shrink-0" />
          <div className="flex items-center gap-1.5 overflow-x-auto">
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
                  {!p.is_active && (
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                  )}
                  {p.name}
                  {!p.is_active && (
                    <span className="text-[9px] font-medium opacity-70">(inactivo)</span>
                  )}
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
                {!portfolios[0].is_active && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                )}
                {portfolios[0].name}
                {!portfolios[0].is_active && (
                  <span className="text-[9px] font-medium opacity-70">(inactivo)</span>
                )}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mt-3">
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

      {error && (
        <p className="mt-3 text-[12px] text-red-500">{error}</p>
      )}

      {loadingPortfolios || loadingItems ? (
        <div className="mt-3 space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-8 bg-slate-50 rounded animate-pulse" />
          ))}
        </div>
      ) : items.length > 0 ? (
        <>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-[12px] border-separate border-spacing-0">
              <thead>
                <tr className="text-left text-slate-400 text-[10px] uppercase tracking-wide">
                  <th className="font-medium pb-2">Código CUPS</th>
                  <th className="font-medium pb-2">Descripción del servicio</th>
                  <th className="font-medium pb-2">Tarifa</th>
                  <th className="font-medium pb-2 text-right">Valor</th>
                  <th className="font-medium pb-2">Autorización</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const isHighlighted = item.proc_code === highlightCode;
                  // Si hay un precio real cargado (final_price > 0), es un
                  // ítem de valor fijo -> se muestra el precio en pesos.
                  // Si no tiene precio (los ISS), el cajero solo necesita
                  // el porcentaje: el valor lo saca de su propio Excel.
                  const hasFixedPrice = item.final_price > 0;

                  return (
                    <tr
                      key={item.proc_code}
                      ref={isHighlighted ? highlightRowRef : undefined}
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
                      <td className={`py-2 text-right font-medium ${isHighlighted ? "border-y-2 border-primary/60" : ""} ${hasFixedPrice ? "text-navy" : "text-slate-500"}`}>
                        {hasFixedPrice ? formatCOP(item.final_price) : `${item.percent}%`}
                      </td>
                      <td
                        className={`py-2 ${
                          isHighlighted ? "border-y-2 border-r-2 border-primary/60 rounded-r-lg" : ""
                        }`}
                      >
                        {item.requires_auth ? (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">Sí</span>
                        ) : (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-50 text-slate-400">No</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-[11px] text-slate-400">
              {total} procedimiento{total !== 1 ? "s" : ""} · página {page} de {totalPages}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1 || loadingItems}
                className="cursor-pointer flex items-center gap-1 text-[11px] font-medium px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:border-slate-300 hover:text-slate-800 transition-colors"
              >
                <ChevronLeft size={13} />
                Anterior
              </button>
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages || loadingItems}
                className="cursor-pointer flex items-center gap-1 text-[11px] font-medium px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:border-slate-300 hover:text-slate-800 transition-colors"
              >
                Siguiente
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="mt-6 py-10 text-center">
          <p className="text-[13px] font-semibold text-navy">Sin tarifario cargado en este portafolio</p>
        </div>
      )}
    </div>
  );
}