"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Hash, FileBarChart, Building2, ChevronRight, Inbox } from "lucide-react";
import { useConvenioVariants } from "@/hooks/useConvenioGroupVariants";
import { BackButton } from "@/components/ui/BackButton";

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

  if (isLoading || !variants) {
    return (
      <div className="min-h-screen bg-slate-50/60">
        <div className="max-w-[1400px] mx-auto p-6 space-y-4 font-sans">
          <div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
          <div className="h-24 bg-white border border-slate-100 rounded-2xl animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-36 bg-white border border-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60">
      <div className="max-w-[1400px] mx-auto p-6 space-y-5 font-sans">
        <BackButton />

        {/* Header card */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center shrink-0 overflow-hidden">
              {companyLogo ? (
                <img src={companyLogo} alt={companyName ?? ""} className="w-full h-full object-contain p-1.5" />
              ) : (
                <Building2 size={20} className="text-primary" />
              )}
            </div>
            <div>
              <h1 className="text-[17px] font-bold text-slate-800 tracking-tight">
                {companyName ?? variants[0]?.name ?? "Convenios"}
              </h1>

              {/* Badges tipo pill, igual que en las cards de la lista */}
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                  {totalCount} convenio{totalCount !== 1 ? "s" : ""}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
                  {activeCount}/{totalCount} activos
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Grid de convenios */}
        {variants.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 bg-white border border-dashed border-slate-200 rounded-2xl">
            <div className="w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center">
              <Inbox size={18} className="text-slate-300" />
            </div>
            <p className="text-[13px] text-slate-400">No se encontraron convenios para esta empresa.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  className="group bg-white border border-slate-100 rounded-2xl shadow-sm p-4 cursor-pointer
                             transition-all duration-200 hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  {/* Fila superior: logo + nombre + chevron */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden">
                        {v.logo_url ? (
                          <img src={v.logo_url} alt={v.name} className="w-full h-full object-contain p-1" />
                        ) : (
                          <Building2 size={14} className="text-slate-400" />
                        )}
                      </div>
                      <h3 className="text-[13px] font-semibold text-slate-800 truncate">{v.name}</h3>
                    </div>
                    <ChevronRight
                      size={15}
                      className="text-slate-300 shrink-0 mt-1 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary/60"
                    />
                  </div>

                  {/* Código de contrato */}
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-2 pl-[42px]">
                    <Hash size={11} className="text-slate-300" />
                    <span className="truncate">{v.contract_key}</span>
                  </div>

                  {/* Badge de estado (único) */}
                  <div className="mt-3 pl-[42px]">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                        isActive ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-slate-300"}`} />
                      {isActive ? "Activo" : "Inactivo"}
                    </span>
                  </div>

                  {/* Footer: procedimientos tarifados */}
                  <div className="mt-3.5 pt-3 border-t border-slate-50 flex items-center gap-1.5 text-[11px] text-slate-500">
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