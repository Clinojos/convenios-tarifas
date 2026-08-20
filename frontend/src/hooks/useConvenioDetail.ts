import { useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "@/config/api";
import { ENDPOINTS } from "@/config/endpoints";
import { getToken } from "@/lib/getToken";

export interface AgreementContact {
  full_name: string | null;
  role: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
}

export interface RequiredDocument {
  order: number;
  description: string;
}

export interface ConvenioDetalleAPI {
  contract_key: string;
  company_nit: string;
  name: string;
  status: string;
  is_active: boolean;
  is_eps: boolean;
  can_invoice: boolean;
  limit: number;
  applies_copay: boolean;
  observations: string;
  modality: string;
  logo_url: string | null;
  avatar_color: string;
  type: string | null;
  total_procedures: number;

  // entidad
  address: string | null;
  phone: string | null;
  habilitation_code: string | null;

  // contrato
  contracted_services: string | null;
  invoice_filing: string | null;
  copayment_collection: string | null;
  start_date: string | null;
  last_rate_increase: string | null;
  expiration_date: string | null;
  auto_renewal: string | null;
  authorization_instructions: string | null;
  radication_documents: string | null;

  required_documents: RequiredDocument[];
  contacts: AgreementContact[];
  hidden_sections: string[];
}

export interface ConvenioUpdatePayload {
  logo_url?: string | null;
  avatar_color?: string | null;
  address?: string | null;
  phone?: string | null;
  habilitation_code?: string | null;
  contracted_services?: string | null;
  invoice_filing?: string | null;
  copayment_collection?: string | null;
  start_date?: string | null;
  last_rate_increase?: string | null;
  expiration_date?: string | null;
  auto_renewal?: string | null;
  authorization_instructions?: string | null;
  radication_documents?: string | null;
  required_documents?: { description: string }[];
  contacts?: AgreementContact[];
  hidden_sections?: string[];
}

export const useConvenioDetail = (contractKey: string | null) => {
  const [convenio, setConvenio] = useState<ConvenioDetalleAPI | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  const fetchDetail = useCallback(async () => {
    if (!contractKey) return;
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      const res = await fetch(
        `${API_BASE_URL}${ENDPOINTS.COMPANIES.BASE}/${encodeURIComponent(contractKey)}/detail`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (res.status === 404) {
        setConvenio(null);
        setError("No encontrado");
        return;
      }
      if (!res.ok) throw new Error("Error en la respuesta");

      const result: ConvenioDetalleAPI = await res.json();
      setConvenio(result);
    } catch (err) {
      console.error(err);
      setError("Error al cargar el convenio");
    } finally {
      setLoading(false);
    }
  }, [contractKey]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const updateConvenio = useCallback(
    async (payload: ConvenioUpdatePayload) => {
      if (!contractKey) return { ok: false, error: "Sin contract_key" };
      setSaving(true);
      try {
        const token = getToken();
        const res = await fetch(
          `${API_BASE_URL}${ENDPOINTS.COMPANIES.BASE}/${encodeURIComponent(contractKey)}/detail`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          },
        );

        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.detail || "Error al guardar");
        }

        const result: ConvenioDetalleAPI = await res.json();
        setConvenio(result);
        return { ok: true };
      } catch (err) {
        console.error(err);
        return {
          ok: false,
          error: err instanceof Error ? err.message : "Error al guardar",
        };
      } finally {
        setSaving(false);
      }
    },
    [contractKey],
  );

  return {
    convenio,
    loading,
    error,
    saving,
    updateConvenio,
    refetch: fetchDetail,
  };
};
