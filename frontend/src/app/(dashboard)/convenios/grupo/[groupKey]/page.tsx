"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Hash, FileBarChart, Building2, ChevronRight, Inbox, Home } from "lucide-react";
import { useConvenioVariants } from "@/hooks/useConvenioGroupVariants";
import { Breadcrumb } from "@/components/convenios/Breadcrumb";

// ---------------------------------------------------------------------------
// Skeleton — mismo shell que el de convenio detalle (h-dvh + overflow-hidden)
// ---------------------------------------------------------------------------

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

export default function GrupoConvenioPage() {
  const params = useParams<{ groupKey: string }>();
  const router = useRouter();
  const { variantsByGroup, companyNameByGroup, loadingGroup, fetchVariants } = useConvenioVariants();

  const groupKey = decodeURIComponent(params.groupKey);
  const variants = variantsByGroup[groupKey];
  const companyName = companyNameByGroup?.[groupKey];
  const isLoading = loadingGroup === groupKey && !variants;
  const companyLogo = variants?.[0]?.logo_url;

  const totalCount = variants?.length ?? 0;
  const activeCount = variants?.filter((v) => v.status === "Activo").length ?? 0;

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
    // Mismo shell que /convenios/[id]: h-dvh + overflow-hidden en la raíz, la
    // página nunca scrollea como un todo. Header con altura natural
    // (shrink-0) y debajo una fila flex-1 min-h-0 donde SOLO el grid de
    // convenios scrollea internamente si no cabe.
    <div className="mx-auto flex h-dvh max-w-[1400px] flex-col gap-4 overflow-hidden p-4 font-sans">
      <Breadcrumb items={breadcrumbItems} />

      {/*
        Header card — mismas clases que el header de convenio detalle
        (rounded-2xl border-slate-100 shadow-sm, p-3 sm:p-4), avatar
        rounded-full en vez de rounded-xl para que coincida con
        ConvenioHeader, y los badges reutilizan el mismo patrón de pill
        (fondo suave + texto en mayúsculas) que ya se usa en el detalle.
      */}
      <div className="flex shrink-0 flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
            {companyLogo ? (
              <img src={companyLogo} alt={companyName ?? ""} className="h-full w-full object-contain p-1.5" />
            ) : (
              <Building2 size={20} className="text-primary" />
            )}
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

      {/*
        Grid de convenios — antes vivía en una página con scroll normal;
        ahora es la fila flex-1 min-h-0 que scrollea sola, igual que
        TabPanel en el detalle.
      */}
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
            {variants.map((v) => {
              const isActive = v.status === "Activo";
              return (
                <div
                  key={v.contract_key}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/convenios/${v.contract_key}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") router.push(`/convenios/${v.contract_key}`);
                  }}
                  className="group cursor-pointer rounded-2xl border border-slate-100 bg-white p-4 shadow-sm
                             transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-50">
                        {v.logo_url ? (
                          <img src={v.logo_url} alt={v.name} className="h-full w-full object-contain p-1" />
                        ) : (
                          <Building2 size={14} className="text-slate-400" />
                        )}
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
    </div>
  );
}