"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import {
  MapPin,
  Phone,
  BadgeCheck,
  CalendarDays,
  Stethoscope,
  FileText,
  Receipt,
  ShieldCheck,
  Contact,
} from "lucide-react";
import { TarifarioBlock } from "@/components/convenios/TarifarioBlock";
import { InformacionContrato } from "@/components/convenios/InformacionContrato";
import { ServiciosContratados } from "@/components/convenios/ServiciosContratados";
import { DocumentosRequeridos } from "@/components/convenios/DocumentosRequeridos";
import { RadicacionFacturas } from "@/components/convenios/RadicacionFacturas";
import { InstruccionesAutorizacion } from "@/components/convenios/InstruccionesAutorizacion";
import { ContactoAdministrativo } from "@/components/convenios/ContactoAdministrativo";
import { ConvenioHeader } from "@/components/convenios/ConvenioHeader";
import { BackButton } from "@/components/ui/BackButton";

import { useConvenioDetail } from "@/hooks/useConvenioDetail";
import { parseObservaciones } from "@/lib/parseObservaciones";

// ---------------------------------------------------------------------------
// Datos rápidos — chips siempre visibles debajo del header
// ---------------------------------------------------------------------------

function QuickFact({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value?: string | null;
}) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2">
      <Icon size={15} className="shrink-0 text-slate-400" />
      <div className="min-w-0">
        <p className="text-[10.5px] uppercase tracking-wide text-slate-400 leading-none mb-0.5">
          {label}
        </p>
        <p className="text-[12.5px] font-medium text-slate-700 truncate leading-none">
          {value}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pestañas secundarias
// ---------------------------------------------------------------------------

type TabId = "servicios" | "documentos" | "radicacion" | "autorizacion" | "contacto";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "servicios", label: "Servicios", icon: Stethoscope },
  { id: "documentos", label: "Documentos", icon: FileText },
  { id: "radicacion", label: "Radicación", icon: Receipt },
  { id: "autorizacion", label: "Autorización", icon: ShieldCheck },
  { id: "contacto", label: "Contacto", icon: Contact },
];

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export default function ConvenioDetallePage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const contractKey = decodeURIComponent(params.id);
  const { convenio, loading, error } = useConvenioDetail(contractKey);

  // Vienen del buscador global cuando el usuario hace click en un
  // resultado de tipo "Procedimiento" (ver useSearch / SearchResult.route):
  // /convenios/{contractKey}?highlight={codigo}&portfolio={ptCodi}
  const highlightCode = searchParams.get("highlight") ?? undefined;
  const highlightPortfolio = searchParams.get("portfolio") ?? undefined;

  // Cantidad real de portafolios — la reporta TarifarioBlock apenas resuelve
  // el fetch, así ConvenioHeader puede mostrar "N portafolios" en el badge.
  const [portfolioCount, setPortfolioCount] = useState(0);

  // Pestaña activa del panel de info secundaria.
  const [activeTab, setActiveTab] = useState<TabId>("servicios");

  // DEBUG TEMPORAL: revisa en la consola qué campos trae realmente
  // `convenio`. Cuando confirmes cuál es el nombre correcto del campo
  // con la empresa matriz, borra este useEffect.
  useEffect(() => {
    if (convenio) {
      console.log("convenio completo:", convenio);
    }
  }, [convenio]);

  if (loading) {
    return (
      <div className="max-w-[1400px] mx-auto p-4 text-[13px] text-slate-500">
        Cargando convenio...
      </div>
    );
  }

  if (error || !convenio) {
    return (
      <div className="max-w-[1400px] mx-auto p-4 space-y-4 font-sans">
        <BackButton />
        <div className="py-16 text-center text-[13px] text-slate-400">
          No se encontró información para este convenio.
        </div>
      </div>
    );
  }

  // Texto de observaciones parseado en secciones.
  const parsedObservaciones = parseObservaciones(convenio.observations ?? "");

  // Nombre de la empresa matriz — se prueban varios nombres de campo
  // posibles porque el shape exacto de `convenio` aún no está confirmado.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const convenioAny = convenio as any;
  const companyName: string | null =
    convenioAny.company_name ??
    convenioAny.parent_company ??
    convenioAny.empresa ??
    convenioAny.group_name ??
    null;

  return (
    <div className="max-w-[1400px] mx-auto p-4 space-y-4 font-sans">
      <BackButton />

      {/* Header Card */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4">
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

        {/* Datos rápidos — siempre visibles, sin clics */}
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          <QuickFact icon={MapPin} label="Dirección" value={parsedObservaciones.direccion} />
          <QuickFact icon={Phone} label="Teléfono" value={parsedObservaciones.telefono} />
          <QuickFact icon={BadgeCheck} label="Habilitación" value={parsedObservaciones.habilitacion} />
          <QuickFact icon={CalendarDays} label="Vencimiento" value={parsedObservaciones.vencimiento} />
        </div>

        {/* Información contrato — completa, siempre visible */}
        <div className="mt-3">
          <InformacionContrato
            startDate={parsedObservaciones.fechaInicio}
            lastRateIncrease={parsedObservaciones.ultimoIncremento}
            expirationDate={parsedObservaciones.vencimiento}
            autoRenewal={parsedObservaciones.prorroga}
          />
        </div>
      </div>

      <TarifarioBlock
        contractKey={convenio.contract_key}
        onPortfoliosChange={setPortfolioCount}
        initialPortfolio={highlightPortfolio}
        highlightCode={highlightCode}
      />

      {/* Panel de pestañas — info secundaria organizada, no escondida */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex overflow-x-auto border-b border-slate-100 px-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`cursor-pointer flex items-center gap-1.5 whitespace-nowrap px-3.5 py-3 text-[12.5px] font-medium border-b-2 transition-colors ${
                  isActive
                    ? "border-slate-800 text-slate-800"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-4">
          {activeTab === "servicios" && (
            <ServiciosContratados contractedServices={parsedObservaciones.servicios} />
          )}
          {activeTab === "documentos" && (
            <DocumentosRequeridos requiredDocuments={parsedObservaciones.documentos} />
          )}
          {activeTab === "radicacion" && (
            <RadicacionFacturas
              invoiceFiling={parsedObservaciones.radicacion}
              radicationDocuments={parsedObservaciones.docRadicacion}
              copaymentCollection={parsedObservaciones.copago}
            />
          )}
          {activeTab === "autorizacion" && (
            <InstruccionesAutorizacion authorizationInstructions={parsedObservaciones.autorizacion} />
          )}
          {activeTab === "contacto" && (
            <ContactoAdministrativo contacts={parsedObservaciones.contactos} />
          )}
        </div>
      </div>
    </div>
  );
}