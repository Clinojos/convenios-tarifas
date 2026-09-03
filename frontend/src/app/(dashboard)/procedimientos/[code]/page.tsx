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
  Home,
  BadgeCheck,
} from "lucide-react";
import { API_BASE_URL } from "@/config/api";
import { COOKIE_NAME } from "@/config/auth";
import { useBreadcrumb, useBreadcrumbNav } from "@/components/breadcrumb/BreadcrumbContext";

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

const PAGE_SIZE = 9;

// Paleta de esta vista: se aleja del azul navy y usa ciruela/ámbar/rosado
// para diferenciar rangos de precio sin depender del color corporativo.
const INK = "#2E2249"; // ciruela oscuro, reemplaza al navy en títulos y botones activos
const INK_MUTED = "#8D89A0";
const BORDER = "#ECE9F4";
const BAND_LOW = "#16A34A"; // económico
const BAND_MID = "#E3A73B"; // medio
const BAND_HIGH = "#C2255C"; // alto

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

  const { listUrl } = useBreadcrumbNav();

  useBreadcrumb([
    {
      id: "home",
      label: "Inicio",
      icon: Home,
      onClick: () => router.push(listUrl || "/procedimientos"),
    },
    { id: "procedure-code", label: code },
  ]);

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

  const { rows, minPrice, maxPrice, activeCount } = useMemo(() => {
    if (!data || data.offers.length === 0) {
      return { rows: [] as Offer[], minPrice: 0, maxPrice: 0, activeCount: 0 };
    }

    const min = Math.min(...data.offers.map((o) => o.price));
    const max = Math.max(...data.offers.map((o) => o.price));
    const active = data.offers.filter((o) => o.is_active).length;

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

    return { rows: filtered, minPrice: min, maxPrice: max, activeCount: active };
  }, [data, query, status, sortDir]);

  // Distribución de precios en 3 bandas (económico / medio / alto), usada
  // por la gráfica circular. Las bandas se calculan por rango de precio,
  // no por cantidad, para que reflejen dónde cae cada convenio en la escala.
  const priceBands = useMemo(() => {
    if (!data || data.offers.length === 0) return null;
    const span = maxPrice - minPrice || 1;
    const bands = [
      { label: "Económico", color: BAND_LOW, count: 0 },
      { label: "Medio", color: BAND_MID, count: 0 },
      { label: "Alto", color: BAND_HIGH, count: 0 },
    ];
    data.offers.forEach((o) => {
      const t = (o.price - minPrice) / span;
      const idx = t <= 1 / 3 ? 0 : t <= 2 / 3 ? 1 : 2;
      bands[idx].count += 1;
    });
    return bands.filter((b) => b.count > 0);
  }, [data, minPrice, maxPrice]);

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
  const barPercent = (price: number) => (range > 0 ? 6 + ((price - minPrice) / range) * 88 : 40);
  const hasOffers = data.total_offers > 0;

  // Geometría del donut de bandas de precio.
  const R = 46;
  const STROKE = 15;
  const CIRC = 2 * Math.PI * R;
  let cumulative = 0;
  const totalBanded = priceBands ? priceBands.reduce((s, b) => s + b.count, 0) : 0;

  return (
    <div className="flex flex-col gap-3 w-full px-6 py-8">
      {!hasOffers ? (
        <div className="bg-white border rounded-2xl p-10 text-center" style={{ borderColor: BORDER }}>
          <p className="text-[13px] font-semibold" style={{ color: INK }}>
            {data.code} · {data.name}
          </p>
          <p className="text-[13px] text-slate-400 mt-1">
            Este procedimiento no tiene convenios asociados todavía.
          </p>
        </div>
      ) : (
        <>
          {/* Fila superior: tarjeta de identidad del procedimiento + gráfica
              circular de precios, una al lado de la otra. */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-3">
            <div
              className="bg-white border rounded-2xl p-6 flex gap-4 items-start relative overflow-hidden"
              style={{ borderColor: BORDER }}
            >
              <div
                className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl"
                style={{ background: `linear-gradient(180deg, ${INK}, ${BAND_HIGH})` }}
                aria-hidden
              />
              <div className="pl-3 min-w-0">
                <span
                  className="inline-block font-mono text-[11px] px-2 py-0.5 rounded-md"
                  style={{ background: "#F4F2FA", color: INK_MUTED }}
                >
                  {data.code}
                </span>
                <h1 className="text-[20px] font-bold leading-snug mt-2" style={{ color: INK }}>
                  {data.name}
                </h1>

                <div className="flex gap-6 mt-4">
                  <div>
                    <div className="text-[10px] text-slate-400">convenios</div>
                    <div className="text-[16px] font-semibold tabular-nums" style={{ color: INK }}>
                      {data.total_offers}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">activos</div>
                    <div className="text-[16px] font-semibold text-emerald-600 tabular-nums">
                      {activeCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">inactivos</div>
                    <div className="text-[16px] font-semibold tabular-nums text-slate-400">
                      {data.total_offers - activeCount}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border rounded-2xl p-5 flex flex-col" style={{ borderColor: BORDER }}>
              <p className="text-[11px] text-slate-400 mb-2">distribución de precios</p>
              <div className="flex items-center gap-4">
                <svg viewBox="0 0 120 120" width={104} height={104} className="shrink-0">
                  <circle cx={60} cy={60} r={R} fill="none" stroke="#F4F2FA" strokeWidth={STROKE} />
                  {priceBands &&
                    priceBands.map((b) => {
                      const fraction = b.count / totalBanded;
                      const length = fraction * CIRC;
                      const angleStart = (cumulative / totalBanded) * 360;
                      cumulative += b.count;
                      return (
                        <circle
                          key={b.label}
                          cx={60}
                          cy={60}
                          r={R}
                          fill="none"
                          stroke={b.color}
                          strokeWidth={STROKE}
                          strokeDasharray={`${length} ${CIRC - length}`}
                          strokeLinecap="butt"
                          transform={`rotate(${-90 + angleStart} 60 60)`}
                        />
                      );
                    })}
                  <text
                    x={60}
                    y={57}
                    textAnchor="middle"
                    className="tabular-nums"
                    style={{ fontSize: 18, fontWeight: 700, fill: INK }}
                  >
                    {data.total_offers}
                  </text>
                  <text x={60} y={72} textAnchor="middle" style={{ fontSize: 8.5, fill: INK_MUTED }}>
                    convenios
                  </text>
                </svg>

                <div className="flex flex-col gap-1.5 min-w-0">
                  {priceBands?.map((b) => (
                    <div key={b.label} className="flex items-center gap-1.5 text-[11px]">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: b.color }}
                        aria-hidden
                      />
                      <span className="text-slate-500">{b.label}</span>
                      <span className="text-slate-400 tabular-nums">· {b.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t" style={{ borderColor: BORDER }}>
                <div>
                  <div className="text-[10px] text-slate-400">desde</div>
                  <div className="text-[14px] font-semibold text-emerald-600 tabular-nums">
                    {formatPrice(minPrice)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400">hasta</div>
                  <div className="text-[14px] font-semibold tabular-nums" style={{ color: BAND_HIGH }}>
                    {formatPrice(maxPrice)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Búsqueda y filtros */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div
              className="flex-1 flex items-center gap-2 bg-white border rounded-lg px-3 py-2"
              style={{ borderColor: BORDER }}
            >
              <Search size={13} className="text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por aseguradora, convenio o portafolio..."
                className="flex-1 text-[12px] outline-none placeholder:text-slate-400 bg-transparent"
              />
            </div>
            <div
              className="flex rounded-lg border overflow-hidden text-[12px] shrink-0 bg-white"
              style={{ borderColor: BORDER }}
            >
              {([
                ["all", "Todos"],
                ["active", "Activos"],
                ["inactive", "Inactivos"],
              ] as [StatusFilter, string][]).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setStatus(value)}
                  className="cursor-pointer px-3 py-2 font-medium transition-colors"
                  style={
                    status === value
                      ? { background: INK, color: "white" }
                      : { color: INK_MUTED }
                  }
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
              className="cursor-pointer flex items-center justify-center gap-1 text-[12px] font-medium bg-white border rounded-lg px-3 py-2 shrink-0 transition-colors"
              style={{ borderColor: BORDER, color: INK_MUTED }}
            >
              Precio {sortDir === "asc" ? "↑" : "↓"}
              <ArrowUpDown size={11} />
            </button>
          </div>

          <p className="text-[11px] text-slate-400 px-0.5">
            {rows.length} convenio{rows.length !== 1 ? "s" : ""}
          </p>

          {/* Grilla de convenios */}
          {pageRows.length === 0 ? (
            <div className="bg-white border rounded-2xl py-14 text-center" style={{ borderColor: BORDER }}>
              <p className="text-[13px] font-semibold" style={{ color: INK }}>
                Sin convenios encontrados para esta búsqueda
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {pageRows.map((offer) => {
                const isCheapest = offer.price === minPrice;
                return (
                  <button
                    key={`${offer.contract_key}-${offer.portfolio_name}`}
                    onClick={() => router.push(offer.route)}
                    className={`cursor-pointer text-left rounded-xl border p-3.5 flex flex-col gap-2.5 transition-colors bg-white hover:bg-[#FAF9FD] ${
                      !offer.is_active ? "opacity-50" : ""
                    }`}
                    style={{ borderColor: isCheapest ? "#B9E4CC" : BORDER }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ background: offer.is_active ? BAND_LOW : "#C7C4D6" }}
                          aria-hidden
                        />
                        <span className="text-[13px] font-semibold truncate" style={{ color: INK }}>
                          {offer.convenio_name}
                        </span>
                      </div>
                      {isCheapest && <BadgeCheck size={14} className="text-emerald-600 shrink-0" />}
                    </div>

                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                      <div className="min-w-0">
                        <div className="text-[9.5px] text-slate-400">empresa</div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-600 truncate">
                          <Building2 size={10} className="text-slate-400 shrink-0" />
                          <span className="truncate">{offer.company_name}</span>
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-[9.5px] text-slate-400">portafolio</div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-600 truncate">
                          <Layers size={10} className="text-slate-400 shrink-0" />
                          <span className="truncate">{offer.portfolio_name}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-end justify-between gap-2 mt-auto pt-1">
                      <div className="h-1 rounded-full overflow-hidden flex-1" style={{ background: "#F4F2FA" }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${barPercent(offer.price)}%`,
                            background: isCheapest ? BAND_LOW : INK,
                            opacity: isCheapest ? 1 : 0.35,
                          }}
                        />
                      </div>
                      <div
                        className="font-mono text-[13px] font-bold tabular-nums shrink-0"
                        style={{ color: isCheapest ? BAND_LOW : INK }}
                      >
                        {formatPrice(offer.price)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-1">
              <p className="text-[11px] text-slate-400">
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, rows.length)} de {rows.length}
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="cursor-pointer flex items-center gap-1 text-[11px] font-medium px-3 py-1.5 rounded-lg border disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white"
                  style={{ borderColor: BORDER, color: INK_MUTED }}
                >
                  <ChevronLeft size={13} />
                  Anterior
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="cursor-pointer flex items-center gap-1 text-[11px] font-medium px-3 py-1.5 rounded-lg border disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white"
                  style={{ borderColor: BORDER, color: INK_MUTED }}
                >
                  Siguiente
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}