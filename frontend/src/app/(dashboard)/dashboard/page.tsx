"use client";

import { useState } from "react";
import { Stethoscope } from "lucide-react";
import { useDashboard } from "@/hooks/useDashboard";
import { useTopConvenios } from "@/hooks/useTopConvenios";
import { GlobalSearch } from "@/components/ui/GlobalSearch";

// Iniciales con un color por convenio, hash simple sobre el nombre para que
// sea estable entre renders sin tener que guardar un color a mano por fila.
const AVATAR_PALETTE = ["bg-primary", "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-purple-500"];
function avatarColor(nombre: string) {
  const hash = [...nombre].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

export default function DashboardPage() {
  const [query, setQuery] = useState("");
  const { total: totalProcedures, loading: loadingProcedures } = useDashboard("procedures");
  const { data: topConvenios, loading: loadingTop } = useTopConvenios(5);

  // Solo se muestran KPIs con endpoint real detras. Insumos en catalogo,
  // ultima actualizacion, "sin tarifario" y "pendiente de digitacion" se
  // quitaron porque no existe todavia una fuente de datos real para ellos
  // (el campo `estado` del convenio en el backend solo distingue
  // Activo/Inactivo por ahora; sin_tarifario/pendiente_digitacion son
  // valores que la spec contempla a futuro, ver seccion 6 del documento).
  //
  // "Convenios activos" (companies) se quito: no aportaba valor real.
  //
  // El fondo de cada tarjeta ahora es un color solido (mismo estilo que los
  // avatares de "Convenios mas consultados") con el icono en blanco, en vez
  // del acento tenue de antes.
  const kpis = [
    {
      title: "Procedimientos en catalogo",
      val: loadingProcedures ? "..." : totalProcedures.toLocaleString(),
      icon: Stethoscope,
      accent: "bg-emerald-500",
    },
  ];

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 p-6 md:p-8 font-sans">
      {/* 1. Buscador global en su propio renglon, a todo el ancho. */}
      <div className="pt-4 text-center">
        <h1 className="text-2xl md:text-[28px] font-semibold text-navy mb-2 tracking-tight">
          Que necesitas consultar?
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          Escribe un codigo CUPS, el nombre de un procedimiento o una empresa con convenio
        </p>
        <GlobalSearch
          variant="compact"
          query={query}
          onQueryChange={setQuery}
          placeholder="Ej: 097100, cirugia de cataratas, Sura..."
          className="max-w-2xl mx-auto"
        />
      </div>

      {/* 2. KPIs reales, en una sola tarjeta a todo el ancho (mismo contenedor
             que el buscador y "Convenios mas consultados") para que todo
             quede alineado en vez de bloques sueltos de distinto tamano. */}
      <div className="p-5 border border-slate-100 rounded-2xl bg-white grid grid-cols-1 divide-y divide-slate-100">
        {kpis.map((kpi) => (
          <div key={kpi.title} className="flex items-center gap-4 py-3 first:pt-0">
            <div className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center ${kpi.accent}`}>
              <kpi.icon size={20} className="text-white" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">{kpi.title}</p>
              <p className="text-2xl font-bold text-navy mt-0.5 leading-none">{kpi.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Accesos directos a convenios mas consultados - datos reales de
             /api/v1/agreements/top-consultadas. group_key es el contract_key
             del CONVENIO individual (no de la empresa), asi que "BANCO" y
             "BANCO1" salen como tarjetas separadas aunque ambos sean de
             Bancolombia. */}
      <div className="p-5 border border-slate-100 rounded-2xl bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[12px] font-medium text-slate-700">Convenios mas consultados</h3>
          <a href="/convenios" className="text-xs font-semibold text-primary hover:underline">
            Ver todos →
          </a>
        </div>

        {loadingTop ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-[92px] rounded-xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : topConvenios.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">
            Todavia no hay suficientes visitas registradas para mostrar un ranking.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {topConvenios.map((c) => (
              <a
                key={c.group_key}
                href={`/convenios/${encodeURIComponent(c.group_key)}`}
                className="relative flex flex-col gap-2 p-4 rounded-xl border border-slate-100 hover:border-primary/40 hover:shadow-md hover:scale-105 hover:z-10 transition-all duration-200"
              >
                <div
                  className={`w-8 h-8 rounded-lg ${avatarColor(c.display_name)} text-white flex items-center justify-center text-xs font-bold`}
                >
                  {c.display_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-semibold text-navy leading-tight">{c.display_name}</p>
                  {c.company_name && (
                    <p className="text-[11px] text-slate-500 truncate">{c.company_name}</p>
                  )}
                  <p className="text-[11px] text-slate-400">
                    {c.visits} consulta{c.visits !== 1 ? "s" : ""}
                    {" - "}
                    <span className={c.is_active ? "text-emerald-600" : "text-rose-500"}>
                      {c.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </p>
                  {c.type && (
                    <span
                      className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        c.type === "propio" ? "bg-primary/10 text-primary" : "bg-purple-50 text-purple-600"
                      }`}
                    >
                      {c.type === "propio" ? "Tarifario propio" : "Programa descuento"}
                    </span>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}