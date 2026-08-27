"use client";

import { useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Hash, FileBarChart, ChevronRight, Inbox, Home } from "lucide-react";
import { useConvenioVariants } from "@/hooks/useConvenioGroupVariants";
import { registerConvenioVisit } from "@/hooks/useConvenios";
import { Breadcrumb } from "@/components/convenios/Breadcrumb";
import { Pagination } from "@/components/ui/Pagination";
import { avatarColor } from "@/components/convenios/avatarColor";

const PAGE_SIZE = 12;

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`rounded-xl bg-slate-100 ${className}`} />;
}

function GrupoConvenioSkeleton() {
  return (
    <div className="mx-auto flex h-dvh max-w-[1400px] flex-col gap-4 overflow-hidden p-4 font-sans animate-pulse">
      <SkeletonBlock className="h-10 w-64 rounded-2xl" />

      <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm sm:p-4">
        <SkeletonBlock className="h-12 w-12 rounded-full shrink-0" />
        <div className="space-y-2 flex-1 min-w-0">
          <SkeletonBlock className="h-4 w-1/3" />
          <SkeletonBlock className="h-3 w-1/4" />
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-36 w-full" />
        ))}
      </div>
    </div>
  );
}

function GrupoConvenioContent() {
  const params = useParams<{ groupKey: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { variantsByGroup, companyNameByGroup, loadingGroup, fetchVariants } = useConvenioVariants();

  const groupKey = decodeURIComponent(params.groupKey);
  const variants = variantsByGroup[groupKey];
  const companyName = companyNameByGroup?.[groupKey];
  const isLoading = loadingGroup === groupKey && !variants;
  const companyLogo = variants?.[0]?.logo_url;

  const page = Number(searchParams.get("page")) || 1;

  const totalCount = variants?.length ?? 0;
  const activeCount = variants?.filter((v) => v.status === "Activo").length ?? 0;

  // Paginación del lado del cliente: el endpoint de grupo trae todas las
  // variantes de la empresa de una sola vez (no soporta page/limit), así
  // que acá solo cortamos el array ya cargado. Si más adelante el backend
  // pagina esto de verdad, este es el único bloque a cambiar.
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const pagedVariants = (variants ?? []).slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Si el usuario llega con un ?page= que ya no existe (por ejemplo el
  // grupo tiene menos variantes de las que pensaba), lo reacomoda a la
  // última página válida en vez de mostrar una grilla vacía.
  useEffect(() => {
    if (variants && page > totalPages) {
      const p = new URLSearchParams(searchParams.toString());
      p.set("page", String(totalPages));
      router.replace(`/convenios/grupo/${params.groupKey}?${p.toString()}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variants, page, totalPages]);

  const handlePageChange = (newPage: number) => {
    const p = new URLSearchParams(searchParams.toString());
    p.set("page", String(newPage));
    router.push(`/convenios/grupo/${params.groupKey}?${p.toString()}`);
  };

  useEffect(() => {
    if (groupKey) fetchVariants(groupKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupKey]);

  const breadcrumbItems = [
    { id: "home", label: "Convenios", icon: Home, onClick: () => router.push("/convenios") },
    { id: "empresa", label: companyName ?? variants?.[0]?.name ?? "Empresa" },
  ];

  if (isLoading || !variants) {
    return <GrupoConvenioSkeleton />;
  }

  return (
    <div className="mx-auto flex h-dvh max-w-[1400px] flex-col gap-4 overflow-hidden p-4 font-sans">
      <Breadcrumb items={breadcrumbItems} />

      <div className="flex shrink-0 flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div
            className={`h-12 w-12 shrink-0 rounded-full flex items-center justify-center font-bold text-[17px] text-white ${avatarColor(
              companyName ?? variants[0]?.name ?? ""
            )}`}
          >
            {(companyName ?? variants[0]?.name ?? "?").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-[17px] font-bold text-slate-800 tracking-tight">
              {companyName ?? variants[0]?.name ?? "Convenios"}
            </h1>
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-600">
                {totalCount} convenio{totalCount !== 1 ? "s" : ""}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-600">
                {activeCount}/{totalCount} activos
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid + paginación: mismo patrón que ConveniosPage (grid flex-1,
          Pagination fija debajo, shrink-0). */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {variants.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white py-20">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50">
              <Inbox size={18} className="text-slate-300" />
            </div>
            <p className="text-[13px] text-slate-400">No se encontraron convenios para esta empresa.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pagedVariants.map((v) => {
              const isActive = v.status === "Activo";

              const handleOpen = () => {
                registerConvenioVisit(v.contract_key);
                router.push(`/convenios/${v.contract_key}`);
              };

              return (
                <div
                  key={v.contract_key}
                  role="button"
                  tabIndex={0}
                  onClick={handleOpen}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") handleOpen();
                  }}
                  className="group cursor-pointer rounded-2xl border border-slate-100 bg-white p-4 shadow-sm
                             transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold text-[12px] text-white ${avatarColor(
                          v.name ?? ""
                        )}`}
                      >
                        {v.name?.charAt(0).toUpperCase() ?? "?"}
                      </div>
                      <h3 className="truncate text-[13px] font-semibold text-slate-800">{v.name}</h3>
                    </div>
                    <ChevronRight
                      size={15}
                      className="mt-1 shrink-0 text-slate-300 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary/60"
                    />
                  </div>

                  <div className="mt-2 flex items-center gap-1.5 pl-[42px] text-[11px] text-slate-400">
                    <Hash size={11} className="text-slate-300" />
                    <span className="truncate">{v.contract_key}</span>
                  </div>

                  <div className="mt-3 pl-[42px]">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                        isActive ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-slate-300"}`} />
                      {isActive ? "Activo" : "Inactivo"}
                    </span>
                  </div>

                  <div className="mt-3.5 flex items-center gap-1.5 border-t border-slate-50 pt-3 text-[11px] text-slate-500">
                    <FileBarChart size={12} className="text-primary/50" />
                    <span>
                      <span className="font-semibold text-slate-700">
                        {(v.total_procedures ?? 0).toLocaleString()}
                      </span>{" "}
                      procedimientos tarifados
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="shrink-0">
        <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
      </div>
    </div>
  );
}

export default function GrupoConvenioPage() {
  return (
    <Suspense fallback={<GrupoConvenioSkeleton />}>
      <GrupoConvenioContent />
    </Suspense>
  );
}