"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Home } from "lucide-react";
import { useConvenios, registerConvenioVisit } from "@/hooks/useConvenios";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { FilterBar } from "@/components/ui/FilterBar";
import { Pagination } from "@/components/ui/Pagination";
import { ConveniosGrid } from "@/components/convenios/ConveniosGrid";
import type { ConvenioGroup } from "@/components/convenios/types";
import { useBreadcrumb, useBreadcrumbNav } from "@/components/breadcrumb/BreadcrumbContext";

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

  // Estado local del input, separado del query param: así el usuario ve lo
  // que escribe al instante, y recién después de una pausa (debounce) se
  // dispara la búsqueda real contra el backend (que busca en TODAS las
  // páginas, no solo en la que está cargada).
  const [searchInput, setSearchInput] = useState(searchQuery);
  const debouncedSearch = useDebouncedValue(searchInput, 400);

  // Si la URL cambia por fuera (ej: alguien navega con el breadcrumb a una
  // URL guardada que ya traía un ?q=...), sincronizamos el input visible.
  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  // `loading` (primera carga) va a la grilla para decidir skeletons.
  // `isFetching` (cualquier refetch) va a la grilla para el dimming, y no
  // dispara nunca el fallback de <Suspense> ni desmonta nada.
  const { convenios, loading, isFetching, totalPages } = useConvenios({
    page,
    searchQuery,
    status: statusFilter,
    id: idFromUrl,
    limit,
  });

  const { setListUrl } = useBreadcrumbNav();

  useEffect(() => {
    setListUrl(`/convenios?${searchParams.toString()}`);
  }, [searchParams, setListUrl]);

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

  // Cuando el valor "asentado" del debounce cambia y difiere del que ya
  // está en la URL, recién ahí actualizamos la URL (dispara el fetch real).
  useEffect(() => {
    if (debouncedSearch !== searchQuery) {
      updateFilter("q", debouncedSearch || null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const openConvenio = (convenio: ConvenioGroup) => {
    if (convenio.total_variants <= 1) {
      const contractKey = convenio.variant_keys?.[0] ?? convenio.group_key;
      registerConvenioVisit(contractKey);
      router.push(`/convenios/${contractKey}`);
    } else {
      router.push(`/convenios/empresa/${convenio.group_key}`);
    }
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div>
          <h1 className="text-[16px] font-bold text-navy">Convenios</h1>
          <p className="text-[12px] text-slate-500">Gestión y monitoreo de empresas y convenios</p>
        </div>

        <FilterBar
          hasActiveFilters={!!searchQuery || !!statusFilter || !!idFromUrl}
          onClear={() => {
            setSearchInput("");
            router.push("/convenios");
          }}
          onFilterChange={updateFilter}
          searchQuery={searchInput}
          onSearchChange={setSearchInput}
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
            ...(statusFilter
              ? [{ label: `Estado: ${statusFilter}`, key: "status", value: null, color: "bg-navy/10 text-navy border-navy/20" }]
              : []),
          ]}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <ConveniosGrid
          convenios={convenios}
          onOpen={openConvenio}
          loading={loading}
          isFetching={isFetching}
          searchQuery={searchQuery}
        />
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