"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Home } from "lucide-react";
import { useConvenios, registerConvenioVisit } from "@/hooks/useConvenios";
import { FilterBar } from "@/components/ui/FilterBar";
import { Pagination } from "@/components/ui/Pagination";
import { ConveniosGrid } from "@/components/convenios/ConveniosGrid";
import type { ConvenioGroup } from "@/components/convenios/types";
import { useBreadcrumb, useBreadcrumbNav } from "./BreadcrumbContext";

import Loading from "./loading";

function ConveniosContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const page = Number(searchParams.get("page")) || 1;
  const searchQuery = searchParams.get("q") || "";
  const statusFilter = searchParams.get("status") || "";
  const sortBy = searchParams.get("sort") || "name";
  const idFromUrl = searchParams.get("id");
  const [limit] = useState(12);

  const { convenios, loading, totalPages } = useConvenios({
    page,
    searchQuery,
    status: statusFilter,
    id: idFromUrl,
    limit,
  });

  const { setListUrl } = useBreadcrumbNav();

  // Guardamos la URL completa (page/filtros) cada vez que cambia, para que
  // si volvemos acá desde el breadcrumb en otra vista, se restaure exactamente
  // esta misma página/filtro en vez de resetear a /convenios "pelado".
  useEffect(() => {
    setListUrl(`/convenios?${searchParams.toString()}`);
  }, [searchParams, setListUrl]);

  // Breadcrumb raíz: un solo ítem, sin onClick porque ya estamos parados
  // acá (mismo criterio que el último ítem en las otras dos vistas).
  useBreadcrumb([{ id: "home", label: "Inicio", icon: Home }]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/convenios?${params.toString()}`);
  };

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("id");
    params.set("page", "1");
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/convenios?${params.toString()}`);
  };

  const openConvenio = (convenio: ConvenioGroup) => {
    if (convenio.total_variants <= 1) {
      const contractKey = convenio.variant_keys?.[0] ?? convenio.group_key;
      registerConvenioVisit(contractKey);
      router.push(`/convenios/${contractKey}`);
    } else {
      // "empresa" en vez de "grupo": misma restricción técnica de Next
      // (rutas dinámicas hermanas ambiguas necesitan un segmento fijo que
      // las distinga), pero con un nombre que sí dice algo en la URL.
      router.push(`/convenios/empresa/${convenio.group_key}`);
    }
  };

  // OJO: ya NO hacemos `if (loading) return <Loading />`.
  // El layout (breadcrumb) y el header/filtros de acá abajo se quedan
  // siempre montados; solo la grilla cambia entre skeleton / datos / empty.
  //
  // Ya no hay wrapper mx-auto/max-w/p-4/h-full acá: eso lo pone
  // app/convenios/layout.tsx una sola vez para las 3 rutas.
  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div>
          <h1 className="text-[16px] font-bold text-navy">Convenios</h1>
          <p className="text-[12px] text-slate-500">Gestión y monitoreo de empresas y convenios</p>
        </div>

        <FilterBar
          hasActiveFilters={!!searchQuery || !!statusFilter || !!idFromUrl}
          onClear={() => router.push("/convenios")}
          onFilterChange={updateFilter}
          filters={{
            status: {
              value: statusFilter,
              options: [
                { label: "Activos", value: "active" },
                { label: "Inactivos", value: "inactive" },
              ],
            },
            sortBy: { value: sortBy, options: [{ label: "Ordenar por nombre", value: "name" }] },
          }}
          activeFilters={[
            ...(searchQuery
              ? [{ label: `Búsqueda: ${searchQuery}`, key: "q", value: null, color: "bg-primary/10 text-primary-dark border-primary/20" }]
              : []),
            ...(statusFilter
              ? [{ label: `Estado: ${statusFilter}`, key: "status", value: null, color: "bg-navy/10 text-navy border-navy/20" }]
              : []),
          ]}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <ConveniosGrid convenios={convenios} onOpen={openConvenio} loading={loading} />
      </div>

      <div className="shrink-0">
        <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
      </div>
    </div>
  );
}

export default function ConveniosPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ConveniosContent />
    </Suspense>
  );
}