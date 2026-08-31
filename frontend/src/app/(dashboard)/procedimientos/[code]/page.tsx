"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Search,
  ArrowUpDown,
  Building2,
  Layers,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { API_BASE_URL } from "@/config/api";
import { COOKIE_NAME } from "@/config/auth";

type Offer = {
  contract_key: string;
  convenio_name: string;
  company_name: string;
  portfolio_name: string;
  price: number;
  is_active: boolean;
  route: string;
};

type ProcedureDetail = {
  code: string;
  name: string;
  total_offers: number;
  offers: Offer[];
};

type StatusFilter = "all" | "active" | "inactive";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 8;

const formatPrice = (n: number) =>
  n.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

export default function ProcedureDetailPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [data, setData] = useState<ProcedureDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    setError(false);

    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${COOKIE_NAME}=`))
      ?.split("=")[1];

    if (!token) {
      setError(true);
      setLoading(false);
      return;
    }

    fetch(`${API_BASE_URL}/procedures/${encodeURIComponent(code)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [code]);

  useEffect(() => setPage(1), [query, status, sortDir]);

  // La búsqueda filtra por las tres cosas que identifican una oferta: la
  // aseguradora, el nombre del convenio y el portafolio. No solo el convenio.
  const { rows, minPrice, maxPrice } = useMemo(() => {
    if (!data) return { rows: [] as Offer[], minPrice: 0, maxPrice: 0 };

    const min = Math.min(...data.offers.map((o) => o.price));
    const max = Math.max(...data.offers.map((o) => o.price));

    const q = query.trim().toLowerCase();
    const filtered = data.offers.filter((o) => {
      const matchesQuery =
        !q ||
        o.company_name.toLowerCase().includes(q) ||
        o.convenio_name.toLowerCase().includes(q) ||
        o.portfolio_name.toLowerCase().includes(q);
      const matchesStatus = status === "all" || (status === "active" ? o.is_active : !o.is_active);
      return matchesQuery && matchesStatus;
    });

    filtered.sort((a, b) => (sortDir === "asc" ? a.price - b.price : b.price - a.price));

    return { rows: filtered, minPrice: min, maxPrice: max };
  }, [data, query, status, sortDir]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) {
    return (
      <div className="p-10 flex items-center justify-center gap-2 text-slate-400 text-sm">
        <Loader2 className="animate-spin" size={16} />
        Cargando comparativo...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-10 text-center text-sm text-slate-400">
        No se encontró el procedimiento con código {code}.
      </div>
    );
  }

  const range = maxPrice - minPrice;
  const barPercent = (price: number) => (range > 0 ? 10 + ((price - minPrice) / range) * 80 : 40);

  return (
    <div className="max-w-[880px] mx-auto px-6 py-10">
      {/* Encabezado: código + nombre como identidad del procedimiento, precios como
          las tres cifras que realmente importan para decidir un convenio */}
      <header className="mb-8">
        <div className="flex items-baseline gap-2.5">
          <span className="font-mono text-[13px] text-slate-400">{data.code}</span>
        </div>
        <h1 className="text-[26px] font-semibold text-navy tracking-tight mt-1 leading-snug">
          {data.name}
        </h1>

        <div className="flex items-baseline gap-6 mt-5">
          <div>
            <div className="text-[11px] text-slate-400 mb-0.5">desde</div>
            <div className="text-xl font-semibold text-emerald-600 tabular-nums">
              {formatPrice(minPrice)}
            </div>
          </div>
          <div className="w-px h-8 bg-slate-200" aria-hidden />
          <div>
            <div className="text-[11px] text-slate-400 mb-0.5">hasta</div>
            <div className="text-xl font-semibold text-slate-400 tabular-nums">
              {formatPrice(maxPrice)}
            </div>
          </div>
          <div className="w-px h-8 bg-slate-200" aria-hidden />
          <div>
            <div className="text-[11px] text-slate-400 mb-0.5">convenios</div>
            <div className="text-xl font-semibold text-navy tabular-nums">{data.total_offers}</div>
          </div>
        </div>
      </header>

      {/* Búsqueda y filtros: filtra por aseguradora, convenio y portafolio a la vez */}
      <div className="flex flex-col sm:flex-row gap-2.5 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por aseguradora, convenio o portafolio..."
            className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/40 transition-shadow"
          />
        </div>
        <div className="flex rounded-lg border border-slate-200 overflow-hidden text-sm shrink-0">
          {([
            ["all", "Todos"],
            ["active", "Activos"],
            ["inactive", "Inactivos"],
          ] as [StatusFilter, string][]).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setStatus(value)}
              className={`px-3.5 py-2.5 transition-colors ${
                status === value ? "bg-navy text-white" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista comparativa: la barra de fondo ubica cada precio en la escala del
          rango completo, para ver el más barato de un vistazo sin leer cada cifra */}
      <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 text-[11px] text-slate-400">
          <span>Convenio</span>
          <button
            onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
            className="flex items-center gap-1 font-medium text-slate-500 hover:text-navy transition-colors"
          >
            Precio <ArrowUpDown size={11} />
          </button>
        </div>

        {pageRows.length === 0 ? (
          <div className="px-4 py-14 text-center text-sm text-slate-400">
            Nada coincide con &ldquo;{query}&rdquo;. Prueba con otro nombre.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pageRows.map((offer) => {
              const isCheapest = offer.price === minPrice;
              return (
                <button
                  key={`${offer.contract_key}-${offer.portfolio_name}`}
                  onClick={() => router.push(offer.route)}
                  className={`cursor-pointer w-full text-left px-4 py-3.5 flex items-center gap-4 transition-colors hover:bg-slate-50 ${
                    !offer.is_active ? "opacity-50" : ""
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      offer.is_active ? "bg-emerald-500" : "bg-rose-400"
                    }`}
                    aria-hidden
                  />

                  <div className="min-w-0 w-[38%] shrink-0">
                    <div className="text-[13px] font-semibold text-navy truncate">
                      {offer.convenio_name}
                    </div>
                    <div className="flex items-center gap-1 text-[11.5px] text-slate-400 mt-0.5">
                      <Building2 size={11} className="shrink-0" />
                      <span className="truncate">{offer.company_name}</span>
                    </div>
                  </div>

                  <div className="hidden md:flex items-center gap-1 text-[11.5px] text-slate-400 w-[18%] shrink-0 min-w-0">
                    <Layers size={11} className="shrink-0" />
                    <span className="truncate">{offer.portfolio_name}</span>
                  </div>

                  <div className="flex-1 min-w-[80px]">
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isCheapest ? "bg-emerald-500" : "bg-primary/50"}`}
                        style={{ width: `${barPercent(offer.price)}%` }}
                      />
                    </div>
                  </div>

                  <div
                    className={`shrink-0 w-28 text-right font-mono text-[13px] font-bold tabular-nums ${
                      isCheapest ? "text-emerald-600" : "text-navy"
                    }`}
                  >
                    {formatPrice(offer.price)}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-[12px] text-slate-400">
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, rows.length)} de {rows.length}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-30 hover:enabled:bg-slate-50"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="text-[13px] text-slate-500 px-2 tabular-nums">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-30 hover:enabled:bg-slate-50"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}