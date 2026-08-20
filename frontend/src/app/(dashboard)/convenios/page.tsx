"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useConvenios } from "@/hooks/useConvenios";
import { FilterBar } from "@/components/ui/FilterBar";
import { Pagination } from "@/components/ui/Pagination";
import { ConveniosGrid } from "@/components/convenios/ConveniosGrid";
import type { ConvenioGroup } from "@/components/convenios/types";
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

  // Empresa con 1 sola variante -> directo a la ficha de detalle
  // Empresa con varias variantes -> pantalla intermedia de selección
  const openConvenio = (convenio: ConvenioGroup) => {
    if (convenio.total_variants <= 1) {
      const contractKey = convenio.variant_keys?.[0] ?? convenio.group_key;
      router.push(`/convenios/${contractKey}`);
    } else {
      router.push(`/convenios/grupo/${convenio.group_key}`);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="max-w-[1400px] mx-auto p-4 space-y-4 font-sans flex flex-col h-full">
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
            status: { value: statusFilter, options: [{ label: "Activos", value: "active" }, { label: "Inactivos", value: "inactive" }] },
            sortBy: { value: sortBy, options: [{ label: "Ordenar por nombre", value: "name" }] },
          }}
          activeFilters={[
            ...(searchQuery ? [{ label: `Búsqueda: ${searchQuery}`, key: "q", value: null, color: "bg-primary/10 text-primary-dark border-primary/20" }] : []),
            ...(statusFilter ? [{ label: `Estado: ${statusFilter}`, key: "status", value: null, color: "bg-navy/10 text-navy border-navy/20" }] : []),
          ]}
        />
      </div>

      <div className="flex-1">
        <ConveniosGrid convenios={convenios} onOpen={openConvenio} />
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
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