"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Building2, AlertCircle, ChevronRight, Hash, CheckCircle2, FileText } from "lucide-react";
import { useContracts } from "@/hooks/useContracts";
import Loading from "./loading";
import { Contract } from "@/types/contract";
import { FilterBar } from "@/components/ui/FilterBar";
import { DetailModal } from "@/components/ui/DetailModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { AuthGuard } from "@/components/AuthGuard";

const ACCENT_COLORS = ["text-blue-600", "text-emerald-600", "text-purple-600", "text-amber-600", "text-rose-600"];

function ContractsContent() {
  const { data: contracts, loading, error } = useContracts();
  useEffect(() => {
    console.log("Datos recibidos de useContracts:", contracts);
  }, [contracts]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  
  // --- AQUÍ ESTÁ LA SOLUCIÓN ---
  // Nos aseguramos de que 'list' siempre sea un arreglo, incluso si 'contracts' es null/undefined
  const list = Array.isArray(contracts) ? contracts : [];

  const searchParams = useSearchParams();
  const router = useRouter();

  const searchQuery = searchParams.get("q") || "";
  const sortBy = searchParams.get("sort") || "name";

  // Usamos 'list' en lugar de 'contracts'
  const filteredContracts = list
    .filter((c: Contract) => {
      const search = searchQuery.toLowerCase().trim();
      if (!search) return true;
      
      const nameMatch = c.name?.toLowerCase().includes(search);
      const epsMatch = c.eps?.toLowerCase().includes(search);
      const codeMatch = c.service_code?.toLowerCase().includes(search);

      return nameMatch || epsMatch || codeMatch;
    })
    .sort((a: Contract, b: Contract) => {
      if (sortBy === "contracts_desc") return (b.active_contracts || 0) - (a.active_contracts || 0);
      if (sortBy === "alerts_desc") return (b.alerts || 0) - (a.alerts || 0);
      return (a.name || "").localeCompare(b.name || "");
    });

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/contracts?${params.toString()}`);
  };

  if (loading) return <Loading />;

  return (
    <div className="max-w-[1400px] mx-auto p-6 space-y-6 font-sans">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-[16px] font-bold text-slate-800">Convenios EPS</h1>
          <p className="text-[12px] text-slate-500">Gestión y monitoreo de contratos vigentes en Hosvital</p>
        </div>

        <FilterBar
          hasActiveFilters={!!searchQuery || sortBy !== "name"}
          onClear={() => router.push('/contracts')}
          onFilterChange={updateFilter}
          filters={{
            sortBy: { 
              value: sortBy, 
              options: [
                { label: "Ordenar por nombre", value: "name" },
                { label: "Más convenios", value: "contracts_desc" },
                { label: "Más alertas", value: "alerts_desc" }
              ] 
            }
          }}
          activeFilters={[
            // Etiqueta de búsqueda
            ...(searchQuery ? [{ label: `Búsqueda: ${searchQuery}`, key: "q", value: null, color: "bg-blue-50 text-blue-700 border-blue-200" }] : []),
            // Etiqueta de ordenamiento (Aquí está el secreto para que aparezca la etiqueta)
            ...(sortBy !== "name" ? [{ label: `Orden: ${sortBy === "contracts_desc" ? "Más convenios" : "Más alertas"}`, key: "sort", value: "name", color: "bg-slate-50 text-slate-700 border-slate-200" }] : [])
          ]}
        />
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-[12px] border border-red-100 flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {filteredContracts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContracts.map((c: Contract, i: number) => (
            <div key={c.id} className="bg-white border border-slate-100 p-5 rounded-2xl hover:border-slate-200 hover:shadow-sm transition-all">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center ${ACCENT_COLORS[i % ACCENT_COLORS.length]}`}>
                  <Building2 size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[13px] font-semibold text-slate-800 truncate leading-tight">{c.name}</h3>
                  <p className="text-[12px] text-slate-500 mt-0.5">{c.eps}</p>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Hash size={12} />
                  <span>{c.service_code || "Sin código"}</span>
                </div>
                <button
                  onClick={() => setSelectedContract(c)}
                  className="cursor-pointer flex items-center text-[11px] font-semibold text-slate-700 hover:text-blue-600 transition-colors"
                >
                  Ver detalle <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="h-[60vh] w-full flex flex-col items-center justify-center text-center px-4 animate-in fade-in zoom-in duration-500">
          <EmptyState 
            title="Sin convenios encontrados"
            message="No existen convenios que coincidan con los filtros de búsqueda aplicados."
            icon={Building2}
          />
        </div>
      )}

      {/* MODAL UNIVERSAL */}
      {selectedContract && (
        <DetailModal
          title={selectedContract.name}
          subtitle={selectedContract.eps || "EPS"}
          icon={<Building2 size={18} className="text-white" />}
          gradient="from-violet-500 via-purple-500 to-indigo-600"
          onClose={() => setSelectedContract(null)}
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 size={14} className="text-emerald-500" />
              </div>
              <div>
                <p className="text-[10px] font-medium opacity-80 uppercase">CONVENIOS</p>
                <p className="text-lg font-bold mt-0.5 text-slate-800">{selectedContract.active_contracts || 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                <AlertCircle size={14} className="text-amber-500" />
              </div>
              <div>
                <p className="text-[10px] font-medium opacity-80 uppercase">ALERTAS</p>
                <p className="text-lg font-bold mt-0.5 text-slate-800">{selectedContract.alerts || 0}</p>
              </div>
            </div>
          </div>
          <div className="h-px bg-slate-100" />
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center mt-0.5">
              <FileText size={14} className="text-slate-300" />
            </div>
            <div>
              <p className="text-[10px] font-medium opacity-80 uppercase mb-2">DESCRIPCIÓN</p>
              <p className="text-[13px] font-medium text-slate-600 leading-relaxed">
                {selectedContract.description || "Sin descripción disponible."}
              </p>
            </div>
          </div>
        </DetailModal>
      )}
    </div>
  );
}

export default function ContractsPage() {
  return (
    <Suspense fallback={<Loading />}>
      {/* Aquí envolvemos el contenido. 
         Si el usuario NO tiene el permiso "view_contracts", 
         será redirigido al /dashboard automáticamente.
      */}
      <AuthGuard permission="view_contracts">
        <ContractsContent />
      </AuthGuard>
    </Suspense>
  );
}