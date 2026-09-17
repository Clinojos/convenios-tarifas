"use client";

import { useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Inbox, Building2, Home } from "lucide-react";
import { useConvenioVariants } from "@/hooks/useConvenioGroupVariants";
import { registerConvenioVisit } from "@/hooks/useConvenios";
import { Pagination } from "@/components/ui/Pagination";
import { EmpresaHeaderCard } from "@/components/convenios/EmpresaHeaderCard";
import { CompanyCard } from "@/components/convenios/CompanyCard";
import { EmptyState } from "@/components/convenios/EmptyState";
import { EmpresaConveniosSkeleton } from "@/components/convenios/skeletons/ConveniosSkeletons";
import { useBreadcrumb, useBreadcrumbNav } from "@/components/breadcrumb/BreadcrumbContext";

const PAGE_SIZE = 12;

function EmpresaConveniosContent() {
  const params = useParams<{ groupKey: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { variantsByGroup, companyNameByGroup, loadingGroup, fetchVariants } = useConvenioVariants();
  const { listUrl, setEmpresaUrl } = useBreadcrumbNav();

  const groupKey = decodeURIComponent(params.groupKey);
  const variants = variantsByGroup[groupKey];
  const companyName = companyNameByGroup?.[groupKey];
  const isLoading = loadingGroup === groupKey && !variants;

  const page = Number(searchParams.get("page")) || 1;

  const totalCount = variants?.length ?? 0;
  const activeCount = variants?.filter((v) => v.status === "Activo").length ?? 0;

  // Paginación del lado del cliente: el endpoint de empresa trae todas las
  // variantes de una sola vez (no soporta page/limit), así que acá solo
  // cortamos el array ya cargado.
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const pagedVariants = (variants ?? []).slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const displayName = companyName ?? variants?.[0]?.name ?? "Empresa";

  // Guardamos la URL completa (con su page) de ESTA empresa puntual, para
  // que si el usuario va al detalle de un convenio y vuelve por breadcrumb,
  // caiga en la misma página en la que estaba (ej: page=6).
  useEffect(() => {
    setEmpresaUrl(groupKey, `/convenios/empresa/${params.groupKey}?${searchParams.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupKey, searchParams]);

  // Breadcrumb: Inicio > Empresa. "Inicio" vuelve a la última URL completa
  // de la lista principal (listUrl), no a "/convenios" pelado.
  // Se actualiza solo cuando llega el nombre real (antes de eso muestra el
  // fallback "Empresa").
  useBreadcrumb([
    { id: "home", label: "Inicio", icon: Home, onClick: () => router.push(listUrl || "/convenios") },
    { id: "empresa", label: displayName, icon: Building2 },
  ]);

  // Si el usuario llega con un ?page= que ya no existe, lo reacomoda a la
  // última página válida en vez de mostrar una grilla vacía.
  useEffect(() => {
    if (variants && page > totalPages) {
      const p = new URLSearchParams(searchParams.toString());
      p.set("page", String(totalPages));
      router.replace(`/convenios/empresa/${params.groupKey}?${p.toString()}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variants, page, totalPages]);

  const handlePageChange = (newPage: number) => {
    const p = new URLSearchParams(searchParams.toString());
    p.set("page", String(newPage));
    router.push(`/convenios/empresa/${params.groupKey}?${p.toString()}`);
  };

  useEffect(() => {
    if (groupKey) fetchVariants(groupKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupKey]);

  const openConvenio = (contractKey: string) => {
    registerConvenioVisit(contractKey);
    router.push(`/convenios/${contractKey}`);
  };

  if (isLoading || !variants) {
    return <EmpresaConveniosSkeleton />;
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <EmpresaHeaderCard name={displayName} totalCount={totalCount} activeCount={activeCount} />

      <div className="min-h-0 flex-1 overflow-y-auto">
        {variants.length === 0 ? (
          <EmptyState icon={Inbox} message="No se encontraron convenios para esta empresa." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pagedVariants.map((v) => (
              <CompanyCard key={v.contract_key} variant={v} onOpen={openConvenio} />
            ))}
          </div>
        )}
      </div>

      <div className="shrink-0">
        <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
      </div>
    </div>
  );
}

export default function EmpresaConveniosPage() {
  return (
    <Suspense fallback={<EmpresaConveniosSkeleton />}>
      <EmpresaConveniosContent />
    </Suspense>
  );
}