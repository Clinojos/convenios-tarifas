"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Search, ArrowDown, ArrowUp, ArrowUpDown, Home } from "lucide-react";
import { API_BASE_URL } from "@/config/api";
import { COOKIE_NAME } from "@/config/auth";
import { useBreadcrumb, useBreadcrumbNav } from "@/components/breadcrumb/BreadcrumbContext";
import { RequirePermission } from "@/components/auth/RequirePermission";
import {
  OfertasConvenioTable,
  formatPrice,
  getTariffFlags,
  type Offer,
} from "@/components/procedimientos/OfertasConvenioTable";

type ProcedureDetail = {
  code: string;
  name: string;
  total_offers: number;
  offers: Offer[];
};

type StatusFilter = "all" | "active" | "inactive";
type SortBy = "" | "price_asc" | "price_desc" | "iss_asc" | "iss_desc";

const INK = "var(--navy)";
const MUTED = "#8A8F98";
const BORDER = "#E7E9EE";
const SURFACE = "#F7F8FA";

const LOW = "var(--success)";
const HIGH = "var(--danger)";

function ProcedureDetailSkeleton() {
  return (
    <div className="flex flex-col gap-3 w-full h-full px-6 py-8 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-3 shrink-0">
        <div className="bg-white border rounded-2xl p-6" style={{ borderColor: BORDER }}>
          <div className="h-4 w-16 rounded-md" style={{ background: SURFACE }} />
          <div className="h-5 w-3/4 rounded-md mt-3" style={{ background: SURFACE }} />
          <div className="h-3 w-full rounded-md mt-5" style={{ background: SURFACE }} />
          <div className="h-3 w-2/3 rounded-md mt-2" style={{ background: SURFACE }} />
        </div>

        <div className="bg-white border rounded-2xl p-5 flex flex-col justify-center gap-4" style={{ borderColor: BORDER }}>
          {[0, 1].map((i) => (
            <div key={i} className="flex flex-col gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full shrink-0" style={{ background: SURFACE }} />
                <div className="flex flex-col gap-1.5 min-w-0">
                  <div className="h-2 w-20 rounded" style={{ background: SURFACE }} />
                  <div className="h-4 w-28 rounded" style={{ background: SURFACE }} />
                </div>
              </div>
              {i === 0 && <div className="h-px" style={{ background: BORDER }} />}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 shrink-0">
        <div className="flex-1 h-[34px] rounded-lg" style={{ background: SURFACE }} />
        <div className="w-full sm:w-52 h-[34px] rounded-lg shrink-0" style={{ background: SURFACE }} />
      </div>

      <div className="h-2.5 w-20 rounded px-0.5 shrink-0" style={{ background: SURFACE }} />

      <div className="bg-white border rounded-2xl overflow-hidden flex-1 min-h-0" style={{ borderColor: BORDER }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-4 py-3.5"
            style={i > 0 ? { borderTop: `1px solid ${BORDER}` } : undefined}
          >
            <div className="h-3 rounded w-[22%]" style={{ background: SURFACE }} />
            <div className="h-3 rounded w-[24%]" style={{ background: SURFACE }} />
            <div className="h-3 rounded w-[20%]" style={{ background: SURFACE }} />
            <div className="h-3 rounded w-[16%]" style={{ background: SURFACE }} />
            <div className="h-3 rounded w-[14%] ml-auto" style={{ background: SURFACE }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ProcedureDetailContent() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page")) || 1;

  const [data, setData] = useState<ProcedureDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("");

  const { listUrl } = useBreadcrumbNav();

  useBreadcrumb([
    {
      id: "home",
      label: "Procedimientos",
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

  useEffect(() => {
    if (page === 1) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");
    router.push(`/procedimientos/${code}?${params.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, status, sortBy]);

  const dedupedOffers = useMemo(() => {
    if (!data) return [];
    const seen = new Map<string, Offer>();
    for (const o of data.offers) {
      const key = `${o.contract_key}::${o.portfolio_name}`;
      if (!seen.has(key)) seen.set(key, o);
    }
    return Array.from(seen.values());
  }, [data]);

  const uniqueConvenios = useMemo(() => {
    if (!data) return [];
    const seen = new Map<string, Offer>();
    for (const o of dedupedOffers) {
      const key = `${o.contract_key}::${o.convenio_name}`;
      if (!seen.has(key)) seen.set(key, o);
    }
    return Array.from(seen.values());
  }, [data, dedupedOffers]);

  const { rows, minOffer, maxOffer, activeCount } = useMemo(() => {
    if (!data || dedupedOffers.length === 0) {
      return { rows: [] as Offer[], minOffer: null as Offer | null, maxOffer: null as Offer | null, activeCount: 0 };
    }

    const fixedPriceOffers = dedupedOffers.filter((o) => getTariffFlags(o).hasFixedPrice);

    let min: Offer | null = fixedPriceOffers.length > 0 ? fixedPriceOffers[0] : null;
    let max: Offer | null = fixedPriceOffers.length > 0 ? fixedPriceOffers[0] : null;
    for (const o of fixedPriceOffers) {
      if (min && o.price < min.price) min = o;
      if (max && o.price > max.price) max = o;
    }

    const active = uniqueConvenios.filter((o) => o.is_active).length;

    const q = query.trim().toLowerCase();
    let filtered = dedupedOffers.filter((o) => {
      const matchesQuery =
        !q ||
        o.company_name.toLowerCase().includes(q) ||
        o.convenio_name.toLowerCase().includes(q) ||
        o.portfolio_name.toLowerCase().includes(q);
      const rowIsActive = o.is_active && o.portfolio_is_active;
      const matchesStatus = status === "all" || (status === "active" ? rowIsActive : !rowIsActive);
      return matchesQuery && matchesStatus;
    });

    if (sortBy === "price_asc" || sortBy === "price_desc") {
      filtered = filtered.filter((o) => getTariffFlags(o).hasFixedPrice);
      filtered.sort((a, b) => (sortBy === "price_asc" ? a.price - b.price : b.price - a.price));
    } else if (sortBy === "iss_asc" || sortBy === "iss_desc") {
      filtered = filtered.filter((o) => getTariffFlags(o).isISS);
      filtered.sort((a, b) => {
        const pa = a.percent ?? 100;
        const pb = b.percent ?? 100;
        return sortBy === "iss_asc" ? pa - pb : pb - pa;
      });
    } else {
      filtered.sort(
        (a, b) =>
          a.company_name.localeCompare(b.company_name, "es", { sensitivity: "base" }) ||
          a.convenio_name.localeCompare(b.convenio_name, "es", { sensitivity: "base" }),
      );
    }

    return { rows: filtered, minOffer: min, maxOffer: max, activeCount: active };
  }, [data, dedupedOffers, uniqueConvenios, query, status, sortBy]);

  const goToPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`/procedimientos/${code}?${params.toString()}`);
  };

  if (loading) {
    return <ProcedureDetailSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="p-10 text-center text-sm text-slate-400">
        No se encontró el procedimiento con código {code}.
      </div>
    );
  }

  const totalOffers = uniqueConvenios.length;
  const inactiveCount = totalOffers - activeCount;
  const hasOffers = totalOffers > 0;

  const emptyTableMessage = !hasOffers
    ? "Este procedimiento no tiene convenios asociados."
    : sortBy === "price_asc" || sortBy === "price_desc"
      ? "No hay convenios con precio fijo para ordenar (los de tipo ISS o SOAT no aplican aquí)."
      : sortBy === "iss_asc" || sortBy === "iss_desc"
        ? "No hay convenios de tipo ISS para ordenar."
        : "Sin convenios encontrados para esta búsqueda";

  return (
    // h-full: ocupa exactamente el espacio que el layout le da. overflow-hidden:
    // nunca debe aparecer scroll aquí — OfertasConvenioTable ajusta cuántas
    // filas muestra para que todo quepa.
    <div className="flex flex-col gap-3 w-full h-full px-6 py-8 overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-3 shrink-0">
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
            {hasOffers ? (
              <>
                Este procedimiento se encuentra en{" "}
                <span className="font-semibold" style={{ color: INK }}>
                  {totalOffers} convenio{totalOffers !== 1 ? "s" : ""}
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
              </>
            ) : (
              "Este procedimiento no tiene convenios asociados."
            )}
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
              <span className="text-[15px] font-semibold tabular-nums" style={{ color: LOW }}>
                {minOffer ? formatPrice(minOffer.price) : "—"}
              </span>
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
              <span className="text-[15px] font-semibold tabular-nums" style={{ color: HIGH }}>
                {maxOffer ? formatPrice(maxOffer.price) : "—"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 shrink-0">
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
              style={status === value ? { background: "var(--primary)", color: "white" } : { color: MUTED }}
            >
              {label}
            </button>
          ))}
        </div>
        <div
          className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 shrink-0 w-full sm:w-auto"
          style={{ borderColor: BORDER }}
        >
          <ArrowUpDown size={13} className="text-slate-400 shrink-0" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="flex-1 text-[12px] outline-none bg-transparent cursor-pointer"
            style={{ color: sortBy ? INK : MUTED }}
          >
            <option value="">Ordenar: sin orden</option>
            <option value="price_asc">Precio: menor a mayor</option>
            <option value="price_desc">Precio: mayor a menor</option>
            <option value="iss_asc">% ISS: menor a mayor</option>
            <option value="iss_desc">% ISS: mayor a menor</option>
          </select>
        </div>
      </div>

      

      <OfertasConvenioTable
          rows={rows}
          page={page}
          onPageChange={goToPage}
          emptyMessage={emptyTableMessage}
          sortBy={sortBy}
        />
    </div>
  );
}

export default function ProcedureDetailPage() {
  return (
    <RequirePermission permission="procedures:view">
      <Suspense fallback={null}>
        <ProcedureDetailContent />
      </Suspense>
    </RequirePermission>
  );
}