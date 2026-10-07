"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Building2, Stethoscope } from "lucide-react";
import { useDashboard } from "@/hooks/useDashboard";
import { useTopConvenios } from "@/hooks/useTopConvenios";
import { useTopProcedures } from "@/hooks/useTopProcedures";
import { GlobalSearch } from "@/components/ui/GlobalSearch";


type TopConvenio = ReturnType<typeof useTopConvenios>["data"][number];

// Paleta de acentos: cada tarjeta toma un color distinto de globals.css,
// rotando por índice. Clases completas (no interpoladas) para que Tailwind
// las detecte en el build.
const ACCENTS = [
  {
    circle: "bg-primary/10",
    icon: "bg-primary shadow-primary/25",
    hover: "hover:border-primary hover:shadow-primary/15",
    // Para las filas de procedimientos: chip suave en reposo, sólido en hover
    soft: "bg-primary/10 text-primary",
    solid: "group-hover:bg-primary group-hover:text-white group-hover:shadow-primary/30",
  },
  {
    circle: "bg-magenta/10",
    icon: "bg-magenta shadow-magenta/25",
    hover: "hover:border-magenta hover:shadow-magenta/15",
    soft: "bg-magenta/10 text-magenta",
    solid: "group-hover:bg-magenta group-hover:text-white group-hover:shadow-magenta/30",
  },
  {
    circle: "bg-orange/10",
    icon: "bg-orange shadow-orange/25",
    hover: "hover:border-orange hover:shadow-orange/15",
    soft: "bg-orange/10 text-orange",
    solid: "group-hover:bg-orange group-hover:text-white group-hover:shadow-orange/30",
  },
  {
    circle: "bg-purple/10",
    icon: "bg-purple shadow-purple/25",
    hover: "hover:border-purple hover:shadow-purple/15",
    soft: "bg-purple/10 text-purple",
    solid: "group-hover:bg-purple group-hover:text-white group-hover:shadow-purple/30",
  },
  {
    circle: "bg-green/10",
    icon: "bg-green shadow-green/25",
    hover: "hover:border-green hover:shadow-green/15",
    soft: "bg-green/10 text-green",
    solid: "group-hover:bg-green group-hover:text-white group-hover:shadow-green/30",
  },
] as const;

// Estilos de las tarjetas "ver todos": gradiente sólido de la paleta,
// distinto a las tarjetas blancas de datos. Clases completas para Tailwind.
const EXPLORE_THEMES = {
  convenios: {
    gradient: "bg-gradient-to-br from-navy via-primary-dark to-primary",
    shadow: "shadow-primary-dark/25 hover:shadow-primary-dark/45",
    cta: "text-navy",
  },
  procedimientos: {
    gradient: "bg-gradient-to-br from-purple via-magenta to-orange",
    shadow: "shadow-magenta/25 hover:shadow-magenta/45",
    cta: "text-magenta",
  },
} as const;

const CARD_BASE =
  "group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm " +
  "transition-all duration-300 ease-out motion-reduce:transition-none " +
  "hover:z-10 hover:-translate-y-1 hover:shadow-xl " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50";

const CIRCLE_BASE = "absolute rounded-full transition-transform duration-500 ease-out group-hover:scale-[2.4]";

const ICON_TILE_BASE =
  "flex shrink-0 items-center justify-center rounded-xl text-white shadow-md " +
  "transition-transform duration-300 group-hover:-rotate-[8deg] group-hover:scale-110";

// Detecta si un texto está cortado con "..." (truncate). Se recalcula cuando
// cambia el contenido o el tamaño del elemento.
function useIsTruncated<T extends HTMLElement>(content: string) {
  const ref = useRef<T>(null);
  const [truncated, setTruncated] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const check = () => setTruncated(el.scrollWidth > el.clientWidth);
    check();

    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [content]);

  return [ref, truncated] as const;
}

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

// El destacado es una tarjeta angosta y compacta; las demás son las
// grandes. Los nombres usan line-clamp-2 para verse completos en vez de
// cortarse con "...".
function ConvenioCard({
  c,
  featured = false,
  accent,
  className = "",
}: {
  c: TopConvenio;
  featured?: boolean;
  accent: (typeof ACCENTS)[number];
  className?: string;
}) {
  return (
    <Link
      href={`/convenios/${encodeURIComponent(c.group_key)}`}
      className={`${CARD_BASE} ${accent.hover} ${
        featured ? "min-h-[130px] hover:scale-[1.03]" : "min-h-[120px] hover:scale-[1.04]"
      } ${className}`}
    >
      <span
        aria-hidden
        className={`${CIRCLE_BASE} ${accent.circle} -top-10 -right-10 w-28 h-28`}
      />

      <div className="relative flex h-full flex-col justify-between gap-3 p-5">
        <div className="flex items-start justify-between">
          <div className={`${ICON_TILE_BASE} ${accent.icon} font-semibold w-10 h-10 text-base`}>
            {c.display_name.charAt(0).toUpperCase()}
          </div>
          <StatusBadge active={c.is_active} />
        </div>

        <div className="min-w-0">
          <p
            title={c.display_name}
            className="line-clamp-2 break-words font-semibold text-navy leading-snug text-[15px]"
          >
            {c.display_name}
          </p>
          {c.company_name && (
            <p title={c.company_name} className="mt-1 line-clamp-2 break-words text-xs text-slate-500 leading-snug">
              {c.company_name}
            </p>
          )}
          {featured && c.type && (
            <p className="text-[11px] text-slate-400 mt-1">
              {c.type === "propio" ? "Tarifario propio" : "Programa de descuento"}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

// Los nombres vienen en MAYÚSCULAS y a veces con el código repetido al inicio.
// Se limpian para que la lista se lea tranquila.
function cleanName(name: string) {
  const n = name.replace(/^\d+\s+/, "").toLowerCase();
  return n.charAt(0).toUpperCase() + n.slice(1);
}

// Fila-tarjeta ligera: mismo lenguaje visual que las tarjetas de convenios.
// Al pasar el mouse sube, toma borde y sombra de su color, el chip del código
// se rellena y rota, la bolita del fondo se expande y la flecha se llena.
//
// Tooltip: si el nombre está cortado con "...", aparece una etiqueta de UNA
// sola línea justo debajo del puntero y lo sigue mientras se mueve. Así no
// tapa la tarjeta de arriba ni el texto que se está leyendo. Es position:fixed
// con pointer-events-none, por lo que no recibe el mouse ni lo recorta el
// overflow-hidden de la tarjeta. Si el puntero está en la mitad derecha de la
// pantalla, la etiqueta se abre hacia la izquierda para no salirse.
function ProcedureRow({
  code,
  name,
  accent,
  className = "",
}: {
  code: string;
  name: string;
  accent: (typeof ACCENTS)[number];
  className?: string;
}) {
  const label = cleanName(name);
  const [nameRef, truncated] = useIsTruncated<HTMLSpanElement>(label);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const [tipWidth, setTipWidth] = useState(0);
  const tipRef = useRef<HTMLSpanElement>(null);

  const handleMove = (e: React.MouseEvent) => {
    if (!truncated) return;
    setPointer({ x: e.clientX, y: e.clientY });
  };

  // Mide el ancho real del tooltip para poder mantenerlo dentro de la pantalla.
  useLayoutEffect(() => {
    if (tipRef.current) setTipWidth(tipRef.current.offsetWidth);
  }, [pointer !== null, label]);

  // Empieza en el puntero; solo se corre a la izquierda lo necesario si no cabe.
  const MARGIN = 8;
  const left = pointer
    ? Math.max(MARGIN, Math.min(pointer.x, window.innerWidth - tipWidth - MARGIN))
    : 0;

  return (
    <li
      className={`relative ${className}`}
      onMouseMove={handleMove}
      onMouseLeave={() => setPointer(null)}
    >
      <Link
        href={`/procedimientos/${code}`}
        className={`group relative flex h-full items-center gap-4 overflow-hidden rounded-2xl border border-slate-200/70 bg-white px-4 py-[clamp(12px,1.9vh,18px)] shadow-sm transition-all duration-300 ease-out hover:z-10 hover:-translate-y-0.5 hover:translate-x-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 motion-reduce:transition-none ${accent.hover}`}
      >
        <span
          aria-hidden
          className={`${CIRCLE_BASE} ${accent.circle} -right-8 -top-8 h-16 w-16`}
        />

        <span
          className={`relative flex h-9 w-[4.5rem] shrink-0 items-center justify-center rounded-lg text-[13px] font-semibold tabular-nums shadow-md shadow-transparent transition-all duration-300 group-hover:-rotate-[4deg] group-hover:scale-105 ${accent.soft} ${accent.solid}`}
        >
          {code}
        </span>

        <span
          ref={nameRef}
          className="relative min-w-0 flex-1 truncate text-sm text-slate-700 transition-colors duration-200 group-hover:text-navy"
        >
          {label}
        </span>

        <span
          className={`relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-white ${accent.solid}`}
        >
          <ArrowRight size={14} />
        </span>
      </Link>

      {truncated && pointer && (
        <span
          ref={tipRef}
          role="tooltip"
          style={{
            position: "fixed",
            top: pointer.y + 18,
            left,
          }}
          className="pointer-events-none z-50 max-w-[calc(100vw-16px)] overflow-hidden text-ellipsis whitespace-nowrap rounded-md border border-[#D9EEF8] bg-white px-2.5 py-1 text-[11px] font-medium text-[#6B9BAE] shadow-sm"
        >
          {label}
        </span>
      )}
    </li>
  );
}

// Tarjeta "ver todos" / catálogo: NO es un ítem más, es una puerta de entrada.
// Por eso va con gradiente sólido de la paleta, texto blanco, destello al
// pasar el mouse y un botón blanco tipo píldora. Se distingue de las
// tarjetas blancas de datos.
function ExploreCard({
  href,
  icon,
  big,
  label,
  cta,
  theme,
  className = "",
}: {
  href: string;
  icon: React.ReactNode;
  big: string;
  label: string;
  cta: string;
  theme: (typeof EXPLORE_THEMES)[keyof typeof EXPLORE_THEMES];
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`group relative overflow-hidden rounded-2xl text-white shadow-lg ${theme.gradient} ${theme.shadow} transition-all duration-300 ease-out motion-reduce:transition-none hover:z-10 hover:-translate-y-1 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 ${className}`}
    >
      {/* Círculos decorativos */}
      <span
        aria-hidden
        className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 transition-transform duration-500 ease-out group-hover:scale-[1.6]"
      />
      <span
        aria-hidden
        className="absolute -bottom-14 -left-10 h-36 w-36 rounded-full bg-white/10 transition-transform duration-500 ease-out group-hover:scale-125"
      />

      {/* Destello que cruza la tarjeta en hover */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 transition-all duration-700 ease-out group-hover:left-[130%] group-hover:opacity-100 motion-reduce:hidden"
      />

      <div className="relative flex h-full flex-col justify-between gap-3 p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white shadow-inner ring-1 ring-white/30 backdrop-blur-sm transition-transform duration-300 group-hover:-rotate-[8deg] group-hover:scale-110">
          {icon}
        </div>

        <div>
          <p className="text-2xl font-bold leading-none tabular-nums drop-shadow-sm">{big}</p>
          <p className="mt-1 text-sm text-white/80">{label}</p>
          <span
            className={`mt-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold shadow-md transition-all duration-300 group-hover:gap-3 group-hover:shadow-lg ${theme.cta}`}
          >
            {cta}
            <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </Link>
  );
}

// Encabezado de sección: mismo formato para convenios y procedimientos.
function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-3.5 flex items-center gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </span>
      <div className="leading-tight">
        <h2 className="text-[15px] font-semibold text-navy">{title}</h2>
        <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>
      </div>
    </div>
  );
}

// Columnas del bloque de convenios en pantallas grandes:
// destacado (angosto) | 2x2 (ancho) | ver todos
const CONVENIOS_GRID =
  "grid grid-cols-2 gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,5fr)_minmax(0,1.6fr)]";

export default function DashboardPage() {
  const [query, setQuery] = useState("");
  const { total: totalProcedures, loading: loadingTotalProcedures } = useDashboard("procedures");

  // Total de convenios para la tarjeta "Ver todos".
  // "agreements"        -> cuenta cada convenio individual (MAEEMP / MENNIT).
  // "agreements/groups" -> cuenta empresas agrupadas. Cambia a este valor si
  //                        la página /convenios lista tarjetas por empresa
  //                        (/agreements/groups) y quieres que el número coincida.
  const { total: totalConvenios, loading: loadingTotalConvenios } = useDashboard("agreements");

  const { data: topConvenios, loading: loadingTop } = useTopConvenios(5);
  // 4 procedimientos = rejilla 2x2, igual que el bloque de convenios
  const { data: topProcedures, loading: loadingTopProcedures } = useTopProcedures(4);

  // El primero del ranking va como tarjeta destacada (compacta);
  // los otros 4 van en la rejilla 2x2 más grande.
  const [featured, ...rest] = topConvenios ?? [];

  return (
    <div className="max-w-[1100px] mx-auto px-6 md:px-8 py-[clamp(20px,4vh,44px)] space-y-[clamp(28px,5vh,52px)] font-sans">
      {/* Buscador */}
      <header className="text-center">
        <h1 className="text-[28px] md:text-[32px] font-semibold text-navy tracking-tight">
          ¿Qué necesitas consultar?
        </h1>
        <p className="mt-2 mb-[clamp(16px,3vh,26px)] text-sm text-slate-500">
          Busca por código CUPS, procedimiento o empresa
        </p>

        <GlobalSearch
          variant="compact"
          query={query}
          onQueryChange={setQuery}
          placeholder="Ej: 097100, cirugía de cataratas, Sura..."
          className="max-w-2xl mx-auto"
        />
      </header>

      {/* Convenios: destacado (compacto) | 2x2 (grande) | ver todos.
          group_key es el contract_key del CONVENIO individual (no de la empresa). */}
      <section>
        <SectionHeader
          icon={<Building2 size={16} />}
          title="Convenios más consultados"
          subtitle="Los convenios con más visitas"
        />

        {loadingTop ? (
          <div className={CONVENIOS_GRID}>
            <div className="col-span-2 lg:col-span-1 min-h-[130px] rounded-2xl bg-slate-100 animate-pulse" />
            <div className="col-span-2 lg:col-span-1 grid grid-cols-2 grid-rows-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="min-h-[120px] rounded-2xl bg-slate-100 animate-pulse" />
              ))}
            </div>
            <div className="col-span-2 lg:col-span-1 min-h-[120px] rounded-2xl bg-slate-100 animate-pulse" />
          </div>
        ) : !featured ? (
          <p className="py-8 text-center text-xs text-slate-400">Todavía no hay visitas registradas.</p>
        ) : (
          <div className={CONVENIOS_GRID}>
            <ConvenioCard
              c={featured}
              featured
              accent={ACCENTS[0]}
              className="col-span-2 lg:col-span-1"
            />

            <div className="col-span-2 lg:col-span-1 grid grid-cols-2 grid-rows-2 gap-3">
              {rest.slice(0, 4).map((c, i) => (
                <ConvenioCard key={c.group_key} c={c} accent={ACCENTS[(i + 1) % ACCENTS.length]} />
              ))}
            </div>

            <ExploreCard
              href="/convenios"
              icon={<Building2 size={18} />}
              big={loadingTotalConvenios ? "..." : totalConvenios.toLocaleString("es-CO")}
              label="convenios"
              cta="Explorar convenios"
              theme={EXPLORE_THEMES.convenios}
              className="col-span-2 lg:col-span-1 min-h-[120px]"
            />
          </div>
        )}
      </section>

      {/* Procedimientos: 2x2 (4 columnas) | catálogo (1 columna) */}
      <section>
        <SectionHeader
          icon={<Stethoscope size={16} />}
          title="Procedimientos más consultados"
          subtitle="Los procedimientos con más visitas"
        />

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
          <ul className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 sm:grid-rows-2 gap-3">
            {loadingTopProcedures ? (
              Array.from({ length: 4 }).map((_, i) => (
                <li key={i}>
                  <div className="h-full min-h-[clamp(58px,8vh,70px)] rounded-2xl bg-slate-100 animate-pulse" />
                </li>
              ))
            ) : !topProcedures || topProcedures.length === 0 ? (
              <li className="sm:col-span-2 py-8 text-center text-xs text-slate-400">
                Todavía no hay visitas registradas.
              </li>
            ) : (
              topProcedures.map((p, i) => (
                <ProcedureRow key={p.code} code={p.code} name={p.name} accent={ACCENTS[i % ACCENTS.length]} />
              ))
            )}
          </ul>

          <ExploreCard
            href="/procedimientos"
            icon={<Stethoscope size={18} />}
            big={loadingTotalProcedures ? "..." : totalProcedures.toLocaleString("es-CO")}
            label="procedimientos"
            cta="Explorar catálogo"
            theme={EXPLORE_THEMES.procedimientos}
            className="min-h-[150px]"
          />
        </div>
      </section>
    </div>
  );
}