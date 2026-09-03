"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Building2,
  Layers,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Home,
  ArrowDown,
  ArrowUp,
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
  tariff_name?: string | null;
  tariff_code?: string | null;
  percent?: number | null;
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

const PAGE_SIZE = 12;

// Paleta tomada directamente de globals.css (variables --navy, --primary,
// --success, --warning, --danger) para que esta vista no invente su propio
// sistema de color. Uso var(...) donde necesito el color sólido; para los
// fondos "tenues" (chips, tags) necesito el valor hex porque le agrego
// transparencia, así que lo dejo también como constante junto al var() que
// le corresponde — si cambian el tema, hay que actualizar el par.
const INK = "var(--navy)"; // #2E3192 — títulos, precio destacado
const ACCENT = "var(--primary)"; // #1AA3D8 — estados activos/interactivos
const ACCENT_HEX = "#1AA3D8";
const MUTED = "#8A8F98"; // gris neutro para labels secundarios
const BORDER = "#E7E9EE";
const SURFACE = "#F7F8FA";

const LOW = "var(--success)"; // precio más bajo
const HIGH = "var(--danger)"; // precio más alto

const formatPrice = (n: number) =>
  n.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

// Mismo criterio que en TarifarioBlock: las tarifas SOAT no manejan valor
// en pesos, así que en vez de mostrar el precio mostramos "UVB {año}". El
// año se calcula en vivo, no hay que tocar esto cada enero.
function getSoatValueLabel() {
  return `UVB ${new Date().getFullYear()}`;
}

function ProcedureDetailContent() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  // La página vive en la URL (?page=N), igual que en /procedimientos, en vez
  // de en un useState local. Así "Anterior"/"Siguiente" son navegación real
  // (URL compartible, botón atrás del navegador funciona) y no solo un
  // cambio de estado en memoria.
  const page = Number(searchParams.get("page")) || 1;

  const [data, setData] = useState<ProcedureDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");

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

  // Al cambiar la búsqueda o el filtro de estado, si no estábamos ya en la
  // página 1 la reseteamos en la URL (misma lógica que setPageInUrl, pero
  // sin tocar historial de más si ya estábamos en 1).
  useEffect(() => {
    if (page === 1) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");
    router.push(`/procedimientos/${code}?${params.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, status]);

  const { rows, minOffer, maxOffer, activeCount } = useMemo(() => {
    if (!data || data.offers.length === 0) {
      return { rows: [] as Offer[], minOffer: null as Offer | null, maxOffer: null as Offer | null, activeCount: 0 };
    }

    // Se guarda el convenio completo (no solo el precio) para poder mostrar
    // junto al monto "quién" tiene el precio más bajo y más alto.
    let min = data.offers[0];
    let max = data.offers[0];
    for (const o of data.offers) {
      if (o.price < min.price) min = o;
      if (o.price > max.price) max = o;
    }
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

    // Orden alfabético por empresa (la aseguradora es lo primero que se ve
    // en cada fila); si dos convenios son de la misma empresa, se desempata
    // por el nombre del convenio para que el orden sea determinista.
    filtered.sort(
      (a, b) =>
        a.company_name.localeCompare(b.company_name, "es", { sensitivity: "base" }) ||
        a.convenio_name.localeCompare(b.convenio_name, "es", { sensitivity: "base" }),
    );

    return { rows: filtered, minOffer: min, maxOffer: max, activeCount: active };
  }, [data, query, status]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // "Precio más bajo" solo se resalta si el mínimo es un precio real (>0).
  // Con muchos convenios en $0 (sin tarifario cargado todavía), marcar TODOS
  // como "más bajo" no comunica nada — solo ensucia la lista.
  const highlightCheapest = !!minOffer && minOffer.price > 0;

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`/procedimientos/${code}?${params.toString()}`);
  };

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

  const inactiveCount = data.total_offers - activeCount;
  const range = maxOffer && minOffer ? maxOffer.price - minOffer.price : 0;
  const barPercent = (price: number) => (range > 0 && minOffer ? 6 + ((price - minOffer.price) / range) * 88 : 40);
  const hasOffers = data.total_offers > 0;

  return (
    <div className="flex flex-col gap-3 w-full px-6 py-8">
      {!hasOffers ? (
        <div className="bg-white border rounded-2xl p-10 text-center" style={{ borderColor: BORDER }}>
          <p className="text-[13px] font-semibold" style={{ color: INK }}>
            {data.code} · {data.name}
          </p>
          <p className="text-[13px] mt-1" style={{ color: MUTED }}>
            Este procedimiento no tiene convenios asociados todavía.
          </p>
        </div>
      ) : (
        <>
          {/* Fila superior: identidad del procedimiento + rango de precios */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-3">
            <div className="bg-white border rounded-2xl p-6" style={{ borderColor: BORDER }}>
              <span
                className="inline-block font-mono text-[11px] px-2 py-0.5 rounded-md"
                style={{ background: SURFACE, color: MUTED }}
              >
                {data.code}
              </span>
              <h1 className="text-[19px] font-semibold leading-snug mt-2" style={{ color: INK }}>
                {data.name}
              </h1>

              <p className="text-[13px] mt-4" style={{ color: MUTED }}>
                Este procedimiento se encuentra en{" "}
                <span className="font-semibold" style={{ color: INK }}>
                  {data.total_offers} convenio{data.total_offers !== 1 ? "s" : ""}
                </span>
                , de los cuales{" "}
                <span className="font-semibold" style={{ color: LOW }}>
                  {activeCount} {activeCount !== 1 ? "están activos" : "está activo"}
                </span>{" "}
                y{" "}
                <span className="font-semibold" style={{ color: MUTED }}>
                  {inactiveCount} {inactiveCount !== 1 ? "están inactivos" : "está inactivo"}
                </span>
                .
              </p>
            </div>

            <div className="bg-white border rounded-2xl p-5 flex flex-col justify-center gap-4" style={{ borderColor: BORDER }}>
              <div className="flex items-center gap-2.5">
                <span
                  className="flex items-center justify-center w-7 h-7 rounded-full shrink-0"
                  style={{ background: "color-mix(in srgb, var(--success) 12%, white)" }}
                >
                  <ArrowDown size={13} style={{ color: LOW }} />
                </span>
                <div className="min-w-0">
                  <div className="text-[10px]" style={{ color: MUTED }}>
                    precio más bajo
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[15px] font-semibold tabular-nums" style={{ color: LOW }}>
                      {minOffer ? formatPrice(minOffer.price) : "—"}
                    </span>
                    {minOffer && (
                      <span className="text-[11px] truncate" style={{ color: MUTED }}>
                        · {minOffer.convenio_name}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="h-px" style={{ background: BORDER }} />

              <div className="flex items-center gap-2.5">
                <span
                  className="flex items-center justify-center w-7 h-7 rounded-full shrink-0"
                  style={{ background: "color-mix(in srgb, var(--danger) 12%, white)" }}
                >
                  <ArrowUp size={13} style={{ color: HIGH }} />
                </span>
                <div className="min-w-0">
                  <div className="text-[10px]" style={{ color: MUTED }}>
                    precio más alto
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[15px] font-semibold tabular-nums" style={{ color: HIGH }}>
                      {maxOffer ? formatPrice(maxOffer.price) : "—"}
                    </span>
                    {maxOffer && (
                      <span className="text-[11px] truncate" style={{ color: MUTED }}>
                        · {maxOffer.convenio_name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Búsqueda y filtros */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex items-center gap-2 bg-white border rounded-lg px-3 py-2" style={{ borderColor: BORDER }}>
              <Search size={13} className="text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por aseguradora, convenio o portafolio..."
                className="flex-1 text-[12px] outline-none placeholder:text-slate-400 bg-transparent"
              />
            </div>
            <div className="flex rounded-lg border overflow-hidden text-[12px] shrink-0 bg-white" style={{ borderColor: BORDER }}>
              {([
                ["all", "Todos"],
                ["active", "Activos"],
                ["inactive", "Inactivos"],
              ] as [StatusFilter, string][]).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setStatus(value)}
                  className="cursor-pointer px-3 py-2 font-medium transition-colors"
                  style={status === value ? { background: ACCENT, color: "white" } : { color: MUTED }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <p className="text-[11px] px-0.5" style={{ color: MUTED }}>
            {rows.length} convenio{rows.length !== 1 ? "s" : ""}
          </p>

          {/* Lista de convenios en formato tabla: empresa → convenio → portafolio → precio,
              siguiendo el mismo patrón visual que TarifarioBlock. */}
          <div className="bg-white border rounded-2xl overflow-hidden" style={{ borderColor: BORDER }}>
            {pageRows.length === 0 ? (
              <div className="py-14 text-center">
                <p className="text-[13px] font-semibold" style={{ color: INK }}>
                  Sin convenios encontrados para esta búsqueda
                </p>
              </div>
            ) : (
              <div className="overflow-hidden">
                <table className="w-full table-fixed text-[12px] border-separate border-spacing-0">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-wide" style={{ color: MUTED }}>
                      <th className="font-medium px-4 py-2.5 w-[26%]">Empresa</th>
                      <th className="font-medium px-4 py-2.5 w-[28%]">Convenio</th>
                      <th className="font-medium px-4 py-2.5 w-[26%]">Portafolio</th>
                      <th className="font-medium px-4 py-2.5 text-right w-[20%]">Precio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((offer, idx) => {
                      const isCheapest = highlightCheapest && offer.price === minOffer?.price;

                      const tariffLabel = offer.tariff_name || offer.tariff_code || "";
                      const isISS = tariffLabel.toUpperCase().startsWith("ISS");
                      const isSOAT = tariffLabel.toUpperCase().startsWith("SOAT");
                      const percent = offer.percent ?? 100;

                      // Igual que en TarifarioBlock: ISS siempre muestra
                      // porcentaje (nunca precio fijo, aunque price > 0);
                      // SOAT nunca muestra precio fijo ni porcentaje,
                      // siempre "UVB {año}".
                      const hasFixedPrice = !isISS && !isSOAT && offer.price > 0;

                      // ISS: 100% = sin recargo -> "0%" (dato válido). 0% = sin dato -> N/A.
                      const percentDisplayISS =
                        percent === 0 ? "N/A" : `${(percent - 100).toFixed(2).replace(/\.00$/, "")}%`;

                      // No-ISS/No-SOAT sin precio fijo: 100% = sin recargo pero sí hay
                      // tarifa -> "$0". 0% = no configurado -> N/A. Cualquier otro valor
                      // -> porcentaje normal.
                      let nonISSDisplay: string;
                      if (percent === 100) {
                        nonISSDisplay = formatPrice(0);
                      } else if (percent === 0) {
                        nonISSDisplay = "N/A";
                      } else {
                        nonISSDisplay = `${(percent - 100).toFixed(2).replace(/\.00$/, "")}%`;
                      }

                      return (
                        <tr
                          key={`${offer.contract_key}-${offer.portfolio_name}-${offer.convenio_name}-${idx}`}
                          onClick={() => router.push(offer.route)}
                          className={`cursor-pointer transition-colors hover:bg-[#FAFBFC] ${!offer.is_active ? "opacity-50" : ""}`}
                          style={{ borderTop: `1px solid ${BORDER}` }}
                        >
                          <td className="px-4 py-3 overflow-hidden">
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ background: offer.is_active ? LOW : "#C9CDD4" }}
                                aria-hidden
                              />
                              <Building2 size={11} className="text-slate-400 shrink-0" />
                              <span className="truncate font-medium" style={{ color: INK }}>
                                {offer.company_name}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-600 overflow-hidden">
                            <span className="truncate block">{offer.convenio_name}</span>
                          </td>
                          <td className="px-4 py-3 overflow-hidden">
                            <div className="flex items-center gap-1.5 text-slate-600 min-w-0">
                              <Layers size={11} className="text-slate-400 shrink-0" />
                              <span className="truncate">{offer.portfolio_name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 overflow-hidden">
                            <div className="flex items-center justify-end gap-2">
                              {hasFixedPrice && (
                                <div className="hidden lg:block w-10 h-1 rounded-full overflow-hidden shrink-0" style={{ background: SURFACE }}>
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${barPercent(offer.price)}%`,
                                      background: isCheapest ? ACCENT : INK,
                                      opacity: isCheapest ? 1 : 0.3,
                                    }}
                                  />
                                </div>
                              )}
                              {isSOAT ? (
                                <span
                                  className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0"
                                  style={{ background: SURFACE, color: MUTED }}
                                >
                                  {getSoatValueLabel()}
                                </span>
                              ) : (
                                <span
                                  className="font-mono font-semibold tabular-nums shrink-0 truncate"
                                  style={{ color: hasFixedPrice && isCheapest ? ACCENT : hasFixedPrice || (!isISS && percent === 100) ? INK : MUTED }}
                                >
                                  {hasFixedPrice ? formatPrice(offer.price) : isISS ? percentDisplayISS : nonISSDisplay}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-1">
              <p className="text-[11px]" style={{ color: MUTED }}>
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, rows.length)} de {rows.length}
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => goToPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="cursor-pointer flex items-center gap-1 text-[11px] font-medium px-3 py-1.5 rounded-lg border disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white"
                  style={{ borderColor: BORDER, color: MUTED }}
                >
                  <ChevronLeft size={13} />
                  Anterior
                </button>
                <button
                  onClick={() => goToPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="cursor-pointer flex items-center gap-1 text-[11px] font-medium px-3 py-1.5 rounded-lg border disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white"
                  style={{ borderColor: BORDER, color: MUTED }}
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

export default function ProcedureDetailPage() {
  return (
    <Suspense fallback={null}>
      <ProcedureDetailContent />
    </Suspense>
  );
}