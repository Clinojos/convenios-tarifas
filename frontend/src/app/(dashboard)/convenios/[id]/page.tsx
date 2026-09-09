"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import { Layers, Info, Home, Building2, Briefcase } from "lucide-react";
import { TarifarioBlock } from "@/components/convenios/TarifarioBlock";
import { InformacionContrato } from "@/components/convenios/InformacionContrato";
import { InformacionUbicacion } from "@/components/convenios/InformacionUbicacion";
import { ServiciosContratados } from "@/components/convenios/ServiciosContratados";
import { DocumentosRequeridos } from "@/components/convenios/DocumentosRequeridos";
import { RadicacionFacturas } from "@/components/convenios/RadicacionFacturas";
import { InstruccionesAutorizacion } from "@/components/convenios/InstruccionesAutorizacion";
import { ContactoAdministrativo } from "@/components/convenios/ContactoAdministrativo";
import { ConvenioHeader } from "@/components/convenios/ConvenioHeader";
import { ConvenioDetalleSkeleton } from "@/components/convenios/skeletons/ConveniosSkeletons";

import { useConvenioDetail } from "@/hooks/useConvenioDetail";
import { parseObservaciones } from "@/lib/parseObservaciones";
import { useBreadcrumb, useBreadcrumbNav } from "../../../../components/breadcrumb/BreadcrumbContext";

// ---------------------------------------------------------------------------
// Pestañas
// ---------------------------------------------------------------------------

type TabId = "portafolio" | "informacion";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "portafolio", label: "Portafolios Procedimientos", icon: Layers },
  { id: "informacion", label: "Información del Contrato", icon: Info },
];

function TabSegmented({ activeTab, onChange }: { activeTab: TabId; onChange: (id: TabId) => void }) {
  return (
    <div className="flex shrink-0 gap-1 overflow-x-auto rounded-full bg-slate-100 p-1">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`cursor-pointer flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors ${
              isActive ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Icon size={15} className="shrink-0" />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function TabPanel({
  activeTab,
  convenio,
  parsedObservaciones,
  onPortfoliosChange,
  initialPortfolio,
  highlightCode,
}: {
  activeTab: TabId;
  convenio: { contract_key: string };
  parsedObservaciones: ReturnType<typeof parseObservaciones>;
  onPortfoliosChange: (n: number) => void;
  initialPortfolio?: string;
  highlightCode?: string;
}) {
  if (activeTab === "portafolio") {
    return (
      <div className="min-w-0 flex-1 h-full">
        <TarifarioBlock
          contractKey={convenio.contract_key}
          onPortfoliosChange={onPortfoliosChange}
          initialPortfolio={initialPortfolio}
          highlightCode={highlightCode}
        />
      </div>
    );
  }

  return (
    <div className="min-w-0 flex-1 overflow-y-auto h-full">
      <div
        className="flex flex-wrap gap-3
                   [&>*]:grow [&>*]:basis-full
                   sm:[&>*]:basis-[calc(50%-0.375rem)]
                   xl:[&>*]:basis-[calc(33.333%-0.5rem)]"
      >
        <InformacionUbicacion
          direccion={parsedObservaciones.direccion}
          telefono={parsedObservaciones.telefono}
          habilitacion={parsedObservaciones.habilitacion}
          vencimiento={parsedObservaciones.vencimiento}
        />
        <InformacionContrato
          startDate={parsedObservaciones.fechaInicio}
          lastRateIncrease={parsedObservaciones.ultimoIncremento}
          expirationDate={parsedObservaciones.vencimiento}
          autoRenewal={parsedObservaciones.prorroga}
        />
        <ServiciosContratados contractedServices={parsedObservaciones.servicios} />
        <DocumentosRequeridos requiredDocuments={parsedObservaciones.documentos} />
        <RadicacionFacturas
          invoiceFiling={parsedObservaciones.radicacion}
          radicationDocuments={parsedObservaciones.docRadicacion}
          copaymentCollection={parsedObservaciones.copago}
        />
        <InstruccionesAutorizacion authorizationInstructions={parsedObservaciones.autorizacion} />
        <ContactoAdministrativo contacts={parsedObservaciones.contactos} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

function ConvenioDetalleContent() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const contractKey = decodeURIComponent(params.id);
  const { convenio, loading, error } = useConvenioDetail(contractKey);
  const { listUrl, getEmpresaUrl } = useBreadcrumbNav();

  const highlightCode = searchParams.get("highlight") ?? undefined;
  const highlightPortfolio = searchParams.get("portfolio") ?? undefined;

  const [portfolioCount, setPortfolioCount] = useState(0);
  const [activeTab, setActiveTab] = useState<TabId>("portafolio");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const convenioAny = convenio as any;
  const companyName: string | null = convenio
    ? convenioAny.company_name ?? convenioAny.parent_company ?? convenioAny.empresa ?? convenioAny.group_name ?? null
    : null;

  const groupKey: string | null = convenio?.company_nit ?? null;

  const savedEmpresaUrl = groupKey ? getEmpresaUrl(groupKey) : undefined;

  const activeTabLabel = TABS.find((t) => t.id === activeTab)?.label ?? "";

  useBreadcrumb(
    convenio
      ? [
          { id: "home", label: "Inicio", icon: Home, onClick: () => router.push(listUrl) },
          ...(companyName && companyName !== convenio.name
            ? [
                {
                  id: "empresa",
                  label: companyName,
                  icon: Building2,
                  onClick: groupKey
                    ? () => router.push(savedEmpresaUrl ?? `/convenios/empresa/${encodeURIComponent(groupKey)}`)
                    : undefined,
                },
              ]
            : []),
          { id: "convenio", label: convenio.name, icon: Briefcase },
          { id: "tab", label: activeTabLabel },
        ]
      : [{ id: "home", label: "Inicio", icon: Home, onClick: () => router.push(listUrl) }]
  );

  if (loading) {
    return <ConvenioDetalleSkeleton />;
  }

  if (error || !convenio) {
    return (
      <div className="flex flex-1 items-center justify-center text-center text-[13px] text-slate-400">
        No se encontró información para este convenio.
      </div>
    );
  }

  const parsedObservaciones = parseObservaciones(convenio.observations ?? "");

  return (
    <>
      <div className="flex shrink-0 flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="min-w-0 flex-1">
          <ConvenioHeader
            name={convenio.name}
            contractKey={convenio.contract_key}
            companyName={companyName}
            logoUrl={convenio.logo_url}
            avatarColor={convenio.avatar_color}
            status={convenio.status}
            isActive={convenio.is_active}
            portfolioCount={portfolioCount}
            isEps={convenio.is_eps}
          />
        </div>

        <TabSegmented activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* Separación visual entre el header/tabs y el contenido de abajo
          (tarifario o info del contrato). Antes iban pegados. */}
      <div className="mt-4 flex min-h-0 flex-1 flex-col">
        <TabPanel
          activeTab={activeTab}
          convenio={convenio}
          parsedObservaciones={parsedObservaciones}
          onPortfoliosChange={setPortfolioCount}
          initialPortfolio={highlightPortfolio}
          highlightCode={highlightCode}
        />
      </div>
    </>
  );
}

export default function ConvenioDetallePage() {
  return (
    <Suspense fallback={<ConvenioDetalleSkeleton />}>
      <ConvenioDetalleContent />
    </Suspense>
  );
}