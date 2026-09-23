"use client";

import { useState } from "react";
import { ArrowRight, Stethoscope } from "lucide-react";
import { useDashboard } from "@/hooks/useDashboard";
import { useTopConvenios } from "@/hooks/useTopConvenios";
import { useTopProcedures } from "@/hooks/useTopProcedures";
import { GlobalSearch } from "@/components/ui/GlobalSearch";

type TopConvenio = ReturnType<typeof useTopConvenios>["data"][number];

// Paleta de acentos: cada tarjeta del ranking toma un color distinto de tus
// variables de globals.css (--magenta, --purple, --orange, --green, --primary),
// rotando por índice. Clases escritas completas (no interpoladas) a proposito,
// para que Tailwind las detecte en el build.
const ACCENTS = [
  {
    circle: "bg-primary/10",
    icon: "bg-primary shadow-primary/25",
    hover: "hover:border-primary hover:shadow-primary/15",
  },
  {
    circle: "bg-magenta/10",
    icon: "bg-magenta shadow-magenta/25",
    hover: "hover:border-magenta hover:shadow-magenta/15",
  },
  {
    circle: "bg-orange/10",
    icon: "bg-orange shadow-orange/25",
    hover: "hover:border-orange hover:shadow-orange/15",
  },
  {
    circle: "bg-purple/10",
    icon: "bg-purple shadow-purple/25",
    hover: "hover:border-purple hover:shadow-purple/15",
  },
  {
    circle: "bg-green/10",
    icon: "bg-green shadow-green/25",
    hover: "hover:border-green hover:shadow-green/15",
  },
] as const;

// Tarjeta base: al pasar el mouse crece, sube, toma borde y sombra del color
// de su acento, el icono rota y la bolita del fondo se expande.
const CARD_BASE =
  "group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm " +
  "transition-all duration-300 ease-out motion-reduce:transition-none " +
  "hover:z-10 hover:-translate-y-1 hover:shadow-xl " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50";

const CIRCLE_BASE = "absolute rounded-full transition-transform duration-500 ease-out group-hover:scale-[2.4]";

const ICON_TILE_BASE =
  "flex shrink-0 items-center justify-center rounded-xl text-white shadow-md " +
  "transition-transform duration-300 group-hover:-rotate-[8deg] group-hover:scale-110";

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${
        active ? "text-emerald-600" : "text-rose-500"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-rose-400"}`} />
      {active ? "Activo" : "Inactivo"}
    </span>
  );
}

function ConvenioCard({ c, featured = false, accent }: { c: TopConvenio; featured?: boolean; accent: (typeof ACCENTS)[number] }) {
  return (
    <a
      href={`/convenios/${encodeURIComponent(c.group_key)}`}
      className={`${CARD_BASE} ${accent.hover} ${
        featured ? "col-span-2 lg:row-span-2 min-h-[150px] hover:scale-[1.02]" : "min-h-[108px] hover:scale-[1.05]"
      }`}
    >
      <span
        aria-hidden
        className={`${CIRCLE_BASE} ${accent.circle} ${featured ? "-top-12 -right-12 w-36 h-36" : "-top-9 -right-9 w-24 h-24"}`}
      />

      <div className={`relative flex h-full flex-col justify-between gap-2 ${featured ? "p-6" : "p-4"}`}>
        <div className="flex items-start justify-between">
          <div className={`${ICON_TILE_BASE} ${accent.icon} font-semibold ${featured ? "w-12 h-12 text-lg" : "w-8 h-8 text-sm"}`}>
            {c.display_name.charAt(0).toUpperCase()}
          </div>
          <StatusBadge active={c.is_active} />
        </div>

        <div className="min-w-0">
          <p className={`font-semibold text-navy leading-tight truncate ${featured ? "text-xl" : "text-sm"}`}>
            {c.display_name}
          </p>
          {c.company_name && (
            <p className={`text-slate-500 truncate mt-0.5 ${featured ? "text-sm" : "text-xs"}`}>{c.company_name}</p>
          )}
          {featured && c.type && (
            <p className="text-xs text-slate-400 mt-1">
              {c.type === "propio" ? "Tarifario propio" : "Programa de descuento"}
            </p>
          )}
        </div>
      </div>
    </a>
  );
}

export default function DashboardPage() {
  const [query, setQuery] = useState("");
  const { total: totalProcedures, loading: loadingTotalProcedures } = useDashboard("procedures");
  const { data: topConvenios, loading: loadingTop } = useTopConvenios(5);
  const { data: topProcedures, loading: loadingTopProcedures } = useTopProcedures(5);

  // El primero del ranking va como tarjeta destacada; los otros 4 al lado.
  const [featured, ...rest] = topConvenios;

  // Las medidas usan clamp() con vh: en pantallas altas respira, en pantallas
  // bajas se compacta solo, para que la pagina no necesite scroll.
  return (
    <div className="max-w-[1100px] mx-auto px-6 md:px-8 py-[clamp(16px,3vh,32px)] space-y-[clamp(20px,3.5vh,36px)] font-sans">
      {/* Buscador */}
      <header className="text-center">
        <h1 className="text-2xl md:text-[26px] font-semibold text-navy tracking-tight mb-1.5">
          ¿Qué necesitas consultar?
        </h1>
        <p className="text-sm text-slate-500 mb-[clamp(12px,2.2vh,20px)]">
          Escribe un código CUPS, el nombre de un procedimiento o una empresa con convenio
        </p>
        <GlobalSearch
          variant="compact"
          query={query}
          onQueryChange={setQuery}
          placeholder="Ej: 097100, cirugía de cataratas, Sura..."
          className="max-w-2xl mx-auto"
        />
      </header>

      {/* Convenios mas consultados: bento con el #1 destacado.
          group_key es el contract_key del CONVENIO individual (no de la
          empresa), asi que "BANCO" y "BANCO1" salen como tarjetas separadas. */}
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-sm font-semibold text-navy">Convenios más consultados</h2>
          <a href="/convenios" className="text-xs text-slate-500 hover:text-primary transition-colors">
            Ver todos
          </a>
        </div>

        {loadingTop ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:auto-rows-[clamp(108px,13vh,128px)]">
            <div className="col-span-2 lg:row-span-2 min-h-[150px] rounded-2xl bg-slate-100 animate-pulse" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="min-h-[108px] rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : !featured ? (
          <p className="text-xs text-slate-400 py-8 text-center">
            Todavía no hay visitas registradas.
          </p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:auto-rows-[clamp(108px,13vh,128px)]">
            <ConvenioCard c={featured} featured accent={ACCENTS[0]} />
            {rest.slice(0, 4).map((c, i) => (
              <ConvenioCard key={c.group_key} c={c} accent={ACCENTS[(i + 1) % ACCENTS.length]} />
            ))}
          </div>
        )}
      </section>

      {/* Procedimientos mas consultados: ahora viene de la BD real
          (tabla procedure_visits), igual que convenios con agreement_visits. */}
      <section>
        <h2 className="text-sm font-semibold text-navy mb-3">Procedimientos más consultados</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <ul className="lg:col-span-2 rounded-2xl border border-slate-200/70 bg-white shadow-sm divide-y divide-slate-100 overflow-hidden">
            {loadingTopProcedures ? (
              Array.from({ length: 5 }).map((_, i) => (
                <li key={i} className="px-5 py-3">
                  <div className="h-4 bg-slate-100 rounded animate-pulse" />
                </li>
              ))
            ) : topProcedures.length === 0 ? (
              <li className="px-5 py-8 text-center text-xs text-slate-400">
                Todavía no hay visitas registradas.
              </li>
            ) : (
              topProcedures.map((p) => (
                <li key={p.code}>
                  <a
                    href={`/procedimientos/${p.code}`}
                    className="group flex items-center gap-4 px-5 py-[clamp(8px,1.2vh,12px)] hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:bg-slate-50"
                  >
                    <span className="w-16 shrink-0 text-sm font-semibold text-primary tabular-nums">{p.code}</span>
                    <span className="flex-1 min-w-0 truncate text-sm text-slate-700 group-hover:text-navy transition-colors">
                      {p.name}
                    </span>
                    <ArrowRight
                      size={14}
                      className="shrink-0 text-primary opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0"
                    />
                  </a>
                </li>
              ))
            )}
          </ul>

          {/* Tarjeta del catalogo: acceso a todos los procedimientos */}
          <a href="/procedimientos" className={`${CARD_BASE} ${ACCENTS[0].hover} min-h-[160px] hover:scale-[1.03]`}>
            <span aria-hidden className={`${CIRCLE_BASE} ${ACCENTS[0].circle} -top-12 -right-12 w-36 h-36`} />
            <div className="relative flex h-full flex-col justify-between gap-3 p-5">
              <div className={`${ICON_TILE_BASE} ${ACCENTS[0].icon} w-10 h-10`}>
                <Stethoscope size={18} />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy leading-none tabular-nums">
                  {loadingTotalProcedures ? "..." : totalProcedures.toLocaleString()}
                </p>
                <p className="text-sm text-slate-500 mt-1">procedimientos en el catálogo</p>
                <span className="mt-2.5 inline-flex items-center gap-2 text-xs font-semibold text-primary">
                  Explorar catálogo
                  <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-1" />
                </span>
              </div>
            </div>
          </a>
        </div>
      </section>
    </div>
  );
}