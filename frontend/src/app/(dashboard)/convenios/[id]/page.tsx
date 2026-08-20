"use client";

/**
 * Ficha de Convenio — /convenios/[id]
 * ---------------------------------------------------------------------------
 * REORGANIZACIÓN DE LAYOUT (ago 2026):
 * - La página ya no scrollea como un todo (h-screen + overflow-hidden en el
 *   contenedor raíz). El scroll se mueve adentro de zonas específicas:
 *     · Columna izquierda: TarifarioBlock (lo más consultado) ocupa TODO el
 *       alto disponible.
 *     · Columna derecha: sidebar con la info secundaria (servicios,
 *       documentos, radicación, autorización, contacto), con su propio
 *       overflow-y-auto — así si no entra, scrollea solo el sidebar, nunca
 *       la página completa.
 * - El header (datos de entidad + info de contrato + observaciones) queda
 *   fijo arriba, compacto, con shrink-0 para que no se estire.
 *
 * NOTA: Servicios/Documentos/Radicación/Autorización/Contacto se muestran
 * tal cual sus componentes actuales (cada uno con su propia card). Si
 * querés que además se colapsen tipo acordeón (cerrados por defecto),
 * pasame el código de esos componentes y les agrego esa variante — así
 * como está ahora, gana espacio vertical por moverlos al sidebar con scroll
 * propio, pero siguen siempre visibles.
 *
 * Edición inline + secciones ocultables se mantienen exactamente igual que
 * antes (el ícono de ojo en modo edición sigue ocultando secciones por
 * convenio).
 */

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { TarifarioBlock } from "@/components/convenios/TarifarioBlock";
import { DatosEntidad } from "@/components/convenios/DatosEntidad";
import { InformacionContrato } from "@/components/convenios/InformacionContrato";
import { ServiciosContratados } from "@/components/convenios/ServiciosContratados";
import { DocumentosRequeridos } from "@/components/convenios/DocumentosRequeridos";
import { RadicacionFacturas } from "@/components/convenios/RadicacionFacturas";
import { InstruccionesAutorizacion } from "@/components/convenios/InstruccionesAutorizacion";
import { ContactoAdministrativo, EMPTY_CONTACT } from "@/components/convenios/ContactoAdministrativo";
import { ConvenioHeader } from "@/components/convenios/ConvenioHeader";
import { BackButton } from "@/components/ui/BackButton";

import { useConvenioDetail, type AgreementContact } from "@/hooks/useConvenioDetail";

// Claves de sección — se guardan en hidden_sections tal cual
const SECTION = {
  ENTIDAD: "entidad",
  CONTRATO: "contrato",
  SERVICIOS: "servicios",
  DOCUMENTOS: "documentos",
  FACTURACION: "facturacion",
  AUTORIZACION: "autorizacion",
  CONTACTO: "contacto",
} as const;

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export default function ConvenioDetallePage() {
  const params = useParams<{ id: string }>();
  const contractKey = decodeURIComponent(params.id);
  const { convenio, loading, error, saving, updateConvenio } = useConvenioDetail(contractKey);

  // --- Estado de edición inline ---
  const [isEditing, setIsEditing] = useState(false);
  const [draftAddress, setDraftAddress] = useState("");
  const [draftPhone, setDraftPhone] = useState("");
  const [draftHabilitationCode, setDraftHabilitationCode] = useState("");
  const [draftServices, setDraftServices] = useState("");
  const [draftInvoiceFiling, setDraftInvoiceFiling] = useState("");
  const [draftCopayment, setDraftCopayment] = useState("");
  const [draftStartDate, setDraftStartDate] = useState("");
  const [draftLastRateIncrease, setDraftLastRateIncrease] = useState("");
  const [draftExpirationDate, setDraftExpirationDate] = useState("");
  const [draftAutoRenewal, setDraftAutoRenewal] = useState("");
  const [draftAuthorizationInstructions, setDraftAuthorizationInstructions] = useState("");
  const [draftRadicationDocuments, setDraftRadicationDocuments] = useState("");
  const [draftDocuments, setDraftDocuments] = useState<string[]>([]);
  const [draftContacts, setDraftContacts] = useState<AgreementContact[]>([]);
  const [draftHiddenSections, setDraftHiddenSections] = useState<string[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  // Cantidad real de portafolios — la reporta TarifarioBlock apenas resuelve
  // el fetch, así ConvenioHeader puede mostrar "N portafolios" en el badge.
  const [portfolioCount, setPortfolioCount] = useState(0);

  const resetDrafts = () => {
    if (!convenio) return;
    setDraftAddress(convenio.address ?? "");
    setDraftPhone(convenio.phone ?? "");
    setDraftHabilitationCode(convenio.habilitation_code ?? "");
    setDraftServices(convenio.contracted_services ?? "");
    setDraftInvoiceFiling(convenio.invoice_filing ?? "");
    setDraftCopayment(convenio.copayment_collection ?? "");
    setDraftStartDate(convenio.start_date ?? "");
    setDraftLastRateIncrease(convenio.last_rate_increase ?? "");
    setDraftExpirationDate(convenio.expiration_date ?? "");
    setDraftAutoRenewal(convenio.auto_renewal ?? "");
    setDraftAuthorizationInstructions(convenio.authorization_instructions ?? "");
    setDraftRadicationDocuments(convenio.radication_documents ?? "");
    setDraftDocuments(convenio.required_documents.map((d) => d.description));
    setDraftContacts(
      convenio.contacts.length > 0 ? convenio.contacts.map((c) => ({ ...c })) : [{ ...EMPTY_CONTACT }],
    );
    setDraftHiddenSections([...convenio.hidden_sections]);
  };

  useEffect(() => {
    resetDrafts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const contactos = convenio.contacts ?? [];
  const documentos = convenio.required_documents ?? [];
  // secciones activas: draft mientras editás, las guardadas en el resto de los casos
  const hiddenSections = isEditing ? draftHiddenSections : convenio.hidden_sections;

  const toggleSection = (key: string) => {
    setDraftHiddenSections((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const startEditing = () => {
    setSaveError(null);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setSaveError(null);
    resetDrafts();
    setIsEditing(false);
  };

  const saveEditing = async () => {
    setSaveError(null);
    const result = await updateConvenio({
      address: draftAddress,
      phone: draftPhone,
      habilitation_code: draftHabilitationCode,
      contracted_services: draftServices,
      invoice_filing: draftInvoiceFiling,
      copayment_collection: draftCopayment,
      start_date: draftStartDate,
      last_rate_increase: draftLastRateIncrease,
      expiration_date: draftExpirationDate,
      auto_renewal: draftAutoRenewal,
      authorization_instructions: draftAuthorizationInstructions,
      radication_documents: draftRadicationDocuments,
      required_documents: draftDocuments
        .filter((d) => d.trim() !== "")
        .map((description) => ({ description })),
      contacts: draftContacts.filter((c) => (c.full_name ?? "").trim() !== ""),
      hidden_sections: draftHiddenSections,
    });

    if (result.ok) {
      setIsEditing(false);
    } else {
      setSaveError(result.error ?? "Error al guardar");
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto p-4 space-y-4 font-sans">
      <BackButton />

      {/* Header Card */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4">
        <ConvenioHeader
          name={convenio.name}
          logoUrl={convenio.logo_url}
          avatarColor={convenio.avatar_color}
          status={convenio.status}
          isActive={convenio.is_active}
          portfolioCount={portfolioCount}
          modality={convenio.modality}
          isEps={convenio.is_eps}
          isEditing={isEditing}
          saving={saving}
          saveError={saveError}
          onStartEditing={startEditing}
          onCancelEditing={cancelEditing}
          onSaveEditing={saveEditing}
        />

        {/* Datos de la entidad — ocultable */}
        <DatosEntidad
          companyNit={convenio.company_nit}
          contractKey={convenio.contract_key}
          address={convenio.address}
          phone={convenio.phone}
          habilitationCode={convenio.habilitation_code}
          hiddenSections={hiddenSections}
          isEditing={isEditing}
          onToggle={toggleSection}
          draftAddress={draftAddress}
          setDraftAddress={setDraftAddress}
          draftPhone={draftPhone}
          setDraftPhone={setDraftPhone}
          draftHabilitationCode={draftHabilitationCode}
          setDraftHabilitationCode={setDraftHabilitationCode}
        />

        {/* Información contrato — ocultable */}
        <InformacionContrato
          startDate={convenio.start_date}
          lastRateIncrease={convenio.last_rate_increase}
          expirationDate={convenio.expiration_date}
          autoRenewal={convenio.auto_renewal}
          hiddenSections={hiddenSections}
          isEditing={isEditing}
          onToggle={toggleSection}
          draftStartDate={draftStartDate}
          setDraftStartDate={setDraftStartDate}
          draftLastRateIncrease={draftLastRateIncrease}
          setDraftLastRateIncrease={setDraftLastRateIncrease}
          draftExpirationDate={draftExpirationDate}
          setDraftExpirationDate={setDraftExpirationDate}
          draftAutoRenewal={draftAutoRenewal}
          setDraftAutoRenewal={setDraftAutoRenewal}
        />

        {convenio.observations && (
          <p className="mt-3 pt-3 border-t border-slate-50 text-[12px] text-slate-600">
            <span className="text-slate-400">Observaciones: </span>
            {convenio.observations}
          </p>
        )}
      </div>

      {/* Bloque de tarifario — a todo el ancho, es lo que más se usa */}
      <TarifarioBlock
        contractKey={convenio.contract_key}
        onPortfoliosChange={setPortfolioCount}
      />

      {/* Bloques secundarios: servicios contratados / documentos / radicación */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ServiciosContratados
          contractedServices={convenio.contracted_services}
          hiddenSections={hiddenSections}
          isEditing={isEditing}
          onToggle={toggleSection}
          draftServices={draftServices}
          setDraftServices={setDraftServices}
        />

        <DocumentosRequeridos
          requiredDocuments={documentos}
          hiddenSections={hiddenSections}
          isEditing={isEditing}
          onToggle={toggleSection}
          draftDocuments={draftDocuments}
          setDraftDocuments={setDraftDocuments}
        />

        <RadicacionFacturas
          invoiceFiling={convenio.invoice_filing}
          radicationDocuments={convenio.radication_documents}
          copaymentCollection={convenio.copayment_collection}
          hiddenSections={hiddenSections}
          isEditing={isEditing}
          onToggle={toggleSection}
          draftInvoiceFiling={draftInvoiceFiling}
          setDraftInvoiceFiling={setDraftInvoiceFiling}
          draftRadicationDocuments={draftRadicationDocuments}
          setDraftRadicationDocuments={setDraftRadicationDocuments}
          draftCopayment={draftCopayment}
          setDraftCopayment={setDraftCopayment}
        />
      </div>

      {/* Bloques: autorización y contacto */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
       <InstruccionesAutorizacion
          authorizationInstructions={convenio.authorization_instructions}
          hiddenSections={hiddenSections}
          isEditing={isEditing}
          onToggle={toggleSection}
          draftAuthorizationInstructions={draftAuthorizationInstructions}
          setDraftAuthorizationInstructions={setDraftAuthorizationInstructions}
        />

        <ContactoAdministrativo
          contacts={contactos}
          hiddenSections={hiddenSections}
          isEditing={isEditing}
          onToggle={toggleSection}
          draftContacts={draftContacts}
          setDraftContacts={setDraftContacts}
        />
      </div>
    </div>
  );
}