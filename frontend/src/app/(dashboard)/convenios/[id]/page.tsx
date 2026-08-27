"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Layers, Info, Home } from "lucide-react";
import { TarifarioBlock } from "@/components/convenios/TarifarioBlock";
import { InformacionContrato } from "@/components/convenios/InformacionContrato";
import { InformacionUbicacion } from "@/components/convenios/InformacionUbicacion";
import { ServiciosContratados } from "@/components/convenios/ServiciosContratados";
import { DocumentosRequeridos } from "@/components/convenios/DocumentosRequeridos";
import { RadicacionFacturas } from "@/components/convenios/RadicacionFacturas";
import { InstruccionesAutorizacion } from "@/components/convenios/InstruccionesAutorizacion";
import { ContactoAdministrativo } from "@/components/convenios/ContactoAdministrativo";
import { ConvenioHeader } from "@/components/convenios/ConvenioHeader";
import { Breadcrumb } from "@/components/convenios/Breadcrumb";

import { useConvenioDetail } from "@/hooks/useConvenioDetail";
import { parseObservaciones } from "@/lib/parseObservaciones";

// ---------------------------------------------------------------------------
// Skeleton — imita la nueva estructura (breadcrumb + header con tabs + panel)
// ---------------------------------------------------------------------------

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`rounded-xl bg-slate-100 ${className}`} />;
}

function ConvenioDetalleSkeleton() {
  // h-full (no h-dvh): esta página vive dentro de <main> del DashboardLayout,
  // que ya tiene su propio alto (viewport - padding). Si pedimos h-dvh aquí
  // (100% del viewport) nos pasamos del espacio real disponible dentro de
  // main (que tiene p-8) y eso hace que "main" scrollee toda la página en
  // vez de que el scroll interno del panel activo haga su trabajo.
  return (
    <div className="mx-auto flex h-full max-w-[1400px] flex-col gap-4 overflow-hidden font-sans animate-pulse">
      <SkeletonBlock className="h-10 w-64 rounded-2xl" />

      <div className="flex shrink-0 flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <SkeletonBlock className="h-12 w-12 rounded-full shrink-0" />
          <div className="space-y-2 flex-1 min-w-0">
            <SkeletonBlock className="h-4 w-1/3" />
            <SkeletonBlock className="h-3 w-1/4" />
          </div>
          <SkeletonBlock className="h-6 w-20 rounded-full hidden sm:block" />
        </div>
        <SkeletonBlock className="h-10 w-48 rounded-full shrink-0" />
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4 flex-1 min-w-0 space-y-3">
          <div className="flex items-center justify-between">
            <SkeletonBlock className="h-4 w-40" />
            <SkeletonBlock className="h-7 w-28 rounded-lg" />
          </div>
          <SkeletonBlock className="h-28 w-full" />
          <SkeletonBlock className="h-28 w-full" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pestañas — solo 2: "Portafolio" queda por defecto, e "Información de
// Contrato" agrupa contrato + servicios + documentos + radicación +
// autorización + contacto administrativo (todo lo que antes se repartía
// entre "Información" y "Documentos").
//
// Ahora viven como segmented control dentro de la tarjeta del header (en
// vez de un rail vertical aparte), porque con solo 2 opciones un rail se
// estira a la altura del panel y deja demasiado espacio vacío. El header
// además tenía espacio libre de sobra para acomodarlas.
// ---------------------------------------------------------------------------

type TabId = "portafolio" | "informacion";

const TABS: {
  id: TabId;
  label: string;
  icon: React.ElementType;
}[] = [
  { id: "portafolio", label: "Portafolios Procedimientos", icon: Layers },
  { id: "informacion", label: "Información del Contrato", icon: Info },
];

function TabSegmented({
  activeTab,
  onChange,
}: {
  activeTab: TabId;
  onChange: (id: TabId) => void;
}) {
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
              isActive
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
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

// Panel reutilizable — mismo lugar donde antes vivía siempre el Tarifario.
// TarifarioBlock ya trae su propia tarjeta (borde/sombra), así que se
// renderiza suelto. En "informacion" TODAS las tarjetas (ubicación,
// contrato, servicios, documentos, radicación, autorización, contacto)
// viven ahora en un único grid parejo — antes "Información general" tenía
// su propio bloque con max-w-xl y quedaba descuadrada del resto.
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
      {/*
        flex-wrap en vez de grid: cada tarjeta define un ancho "objetivo"
        por breakpoint (basis-*) pero puede crecer (grow) para repartirse
        el espacio sobrante cuando la última fila no se completa — así la
        tarjeta que queda sola nunca se ve angosta con hueco al lado.
        Como bono, align-items: stretch (default de flex) empareja la
        altura de las tarjetas dentro de una misma fila.
      */}
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

export default function ConvenioDetallePage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const contractKey = decodeURIComponent(params.id);
  const { convenio, loading, error } = useConvenioDetail(contractKey);

  const highlightCode = searchParams.get("highlight") ?? undefined;
  const highlightPortfolio = searchParams.get("portfolio") ?? undefined;

  const [portfolioCount, setPortfolioCount] = useState(0);
  // "Portafolio" queda como pestaña por defecto: es lo que más se consulta
  // y coincide con lo que llega desde el buscador global (highlight/portfolio).
  const [activeTab, setActiveTab] = useState<TabId>("portafolio");

  if (loading) {
    return <ConvenioDetalleSkeleton />;
  }

  if (error || !convenio) {
    return (
      <div className="mx-auto flex h-full max-w-[1400px] flex-col gap-4 overflow-hidden font-sans">
        <Breadcrumb
          items={[
            { id: "home", label: "Convenios", icon: Home, onClick: () => router.push("/convenios") },
            { id: "error", label: "No encontrado" },
          ]}
        />
        <div className="flex flex-1 items-center justify-center text-center text-[13px] text-slate-400">
          No se encontró información para este convenio.
        </div>
      </div>
    );
  }

  const parsedObservaciones = parseObservaciones(convenio.observations ?? "");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const convenioAny = convenio as any;
  const companyName: string | null =
    convenioAny.company_name ??
    convenioAny.parent_company ??
    convenioAny.empresa ??
    convenioAny.group_name ??
    null;

  // El group key para la ruta /convenios/grupo/{groupKey} es el NIT de la
  // empresa (company_nit), que es el campo real que trae la API de detalle
  // y el que espera el endpoint de grupos en el backend.
  const groupKey: string | null = convenio.company_nit ?? null;

  // Trail: Convenios > Empresa (si aplica) > Nombre del convenio > Pestaña activa
  // La empresa solo se muestra si existe y es distinta del nombre del
  // convenio (evita repetir "22120 > 22120" en convenios sin variantes).
  const activeTabLabel = TABS.find((t) => t.id === activeTab)?.label ?? "";
  const breadcrumbItems = [
    { id: "home", label: "Convenios", icon: Home, onClick: () => router.push("/convenios") },
    ...(companyName && companyName !== convenio.name
      ? [
          {
            id: "empresa",
            label: companyName,
            onClick: groupKey ? () => router.push(`/convenios/grupo/${encodeURIComponent(groupKey)}`) : undefined,
          },
        ]
      : []),
    { id: "convenio", label: convenio.name },
    { id: "tab", label: activeTabLabel },
  ];

  return (
    // h-full (no h-dvh) + overflow-hidden en la raíz: esta página ya no
    // asume que es dueña del viewport completo, sino que respeta el alto
    // que le da <main> en el DashboardLayout (que a su vez es
    // "viewport - padding"). Con h-dvh aquí, el contenido siempre era un
    // poco más alto que ese espacio real y disparaba el scroll de "main".
    // Header con altura natural (shrink-0) y, debajo, una sola fila
    // que ocupa el resto del alto disponible (flex-1 min-h-0) — ahí es donde
    // el panel activo tiene su propio scroll interno si el contenido no cabe
    // (ver TabPanel).
    <div className="mx-auto flex h-full max-w-[1400px] flex-col gap-4 overflow-hidden font-sans">
      {/* Breadcrumb — ahora incluye la empresa cuando el convenio pertenece a un grupo */}
      <Breadcrumb items={breadcrumbItems} />

      {/*
        Header: antes solo llevaba ConvenioHeader y le sobraba espacio.
        Ahora, en pantallas sm+, el segmented control de tabs va al lado
        derecho; en móvil se apila debajo para no apretar el nombre/logo.
      */}
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

      {/*
        Fila única para el panel activo: ya no hay TabRail acompañándolo,
        así que ocupa todo el ancho disponible.
      */}
      <div className="flex min-h-0 flex-1 flex-col">
        <TabPanel
          activeTab={activeTab}
          convenio={convenio}
          parsedObservaciones={parsedObservaciones}
          onPortfoliosChange={setPortfolioCount}
          initialPortfolio={highlightPortfolio}
          highlightCode={highlightCode}
        />
      </div>
    </div>
  );
}