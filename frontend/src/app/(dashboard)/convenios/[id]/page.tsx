"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import { Layers, Info, Home, Building2, Briefcase, FileX2 } from "lucide-react";
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
import { useBreadcrumb, useBreadcrumbNav } from "@/components/breadcrumb/BreadcrumbContext";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Devuelve true si el valor (string, array u objeto) contiene algo útil. */
const hasValue = (v: unknown): boolean => {
  if (v == null) return false;
  if (typeof v === "string") {
    const s = v.trim();
    return s !== "" && s !== "-" && s !== "—";
  }
  if (Array.isArray(v)) return v.some(hasValue);
  if (typeof v === "object") return Object.values(v as object).some(hasValue);
  return true;
};

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

// ---------------------------------------------------------------------------
// Estado vacío
// ---------------------------------------------------------------------------

function EmptyContractInfo() {
  return (
    <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white px-6 py-12 text-center shadow-sm">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-50">
        <FileX2 size={26} className="text-slate-300" strokeWidth={1.5} />
      </div>
      
      <p className="mt-1 max-w-xs text-[12.5px] text-slate-400">
        Aún no se ha registrado infromación para este contrato.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Panel de contenido
// ---------------------------------------------------------------------------

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

  const p = parsedObservaciones;

  // Cada sección se muestra solo si tiene datos.
  const sections = [
    {
      key: "ubicacion",
      show: hasValue([p.direccion, p.telefono, p.habilitacion]),
      node: (
        <InformacionUbicacion
          direccion={p.direccion}
          telefono={p.telefono}
          habilitacion={p.habilitacion}
          vencimiento={p.vencimiento}
        />
      ),
    },
    {
      key: "contrato",
      show: hasValue([p.fechaInicio, p.ultimoIncremento, p.vencimiento, p.prorroga]),
      node: (
        <InformacionContrato
          startDate={p.fechaInicio}
          lastRateIncrease={p.ultimoIncremento}
          expirationDate={p.vencimiento}
          autoRenewal={p.prorroga}
        />
      ),
    },
    {
      key: "servicios",
      show: hasValue(p.servicios),
      node: <ServiciosContratados contractedServices={p.servicios} />,
    },
    {
      key: "documentos",
      show: hasValue(p.documentos),
      node: <DocumentosRequeridos requiredDocuments={p.documentos} />,
    },
    {
      key: "radicacion",
      show: hasValue([p.radicacion, p.docRadicacion, p.copago]),
      node: (
        <RadicacionFacturas
          invoiceFiling={p.radicacion}
          radicationDocuments={p.docRadicacion}
          copaymentCollection={p.copago}
        />
      ),
    },
    {
      key: "autorizacion",
      show: hasValue(p.autorizacion),
      node: <InstruccionesAutorizacion authorizationInstructions={p.autorizacion} />,
    },
    {
      key: "contactos",
      show: hasValue(p.contactos),
      node: <ContactoAdministrativo contacts={p.contactos} />,
    },
  ].filter((s) => s.show);

  if (sections.length === 0) {
    return (
      <div className="min-w-0 flex-1 h-full">
        <EmptyContractInfo />
      </div>
    );
  }

  return (
    <div className="min-w-0 flex-1 overflow-y-auto h-full">
      <div className="flex flex-wrap gap-3">
        {sections.map((s) => (
          // El wrapper es el item del flex (grow + basis); la tarjeta lo llena por completo.
          <div
            key={s.key}
            className="flex min-w-0 grow basis-full sm:basis-[calc(50%-0.375rem)] xl:basis-[calc(33.333%-0.5rem)] [&>*]:min-w-0 [&>*]:flex-1"
          >
            {s.node}
          </div>
        ))}
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
          {
            id: "home",
            label: "Inicio",
            icon: Home,
            onClick: () => router.push(listUrl || "/convenios"),
          },
          ...(companyName && companyName !== convenio.name
            ? [
                {
                  id: "empresa",
                  label: companyName,
                  icon: Building2,
                  onClick: groupKey
                    ? () =>
                        router.push(
                          savedEmpresaUrl ?? `/convenios/empresa/${encodeURIComponent(groupKey)}`,
                        )
                    : undefined,
                },
              ]
            : []),
          { id: "convenio", label: convenio.name, icon: Briefcase },
          { id: "tab", label: activeTabLabel },
        ]
      : [
          {
            id: "home",
            label: "Inicio",
            icon: Home,
            onClick: () => router.push(listUrl || "/convenios"),
          },
        ],
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

      {/* Separación visual entre el header/tabs y el contenido de abajo */}
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