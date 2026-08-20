// hooks/useConvenioGroupVariants.ts
import { useState } from "react";
import { ConvenioVariantDetail } from "@/types/convenio";
import { API_BASE_URL } from "@/config/api";
import { ENDPOINTS } from "@/config/endpoints";
import { getToken } from "@/lib/getToken";

export const useConvenioVariants = () => {
  const [variantsByGroup, setVariantsByGroup] = useState<
    Record<string, ConvenioVariantDetail[]>
  >({});
  const [companyNameByGroup, setCompanyNameByGroup] = useState<
    Record<string, string>
  >({});
  const [loadingGroup, setLoadingGroup] = useState<string | null>(null);

  const fetchVariants = async (groupKey: string) => {
    if (variantsByGroup[groupKey]) return;

    setLoadingGroup(groupKey);
    try {
      const token = getToken();

      const res = await fetch(
        `${API_BASE_URL}${ENDPOINTS.COMPANIES.GROUPS}/${encodeURIComponent(groupKey)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!res.ok) throw new Error("Error en la respuesta");

      const result = await res.json();
      const variants = (result.data || []) as ConvenioVariantDetail[];
      // El backend siempre devuelve company_name a nivel raíz
      // (route de agreements: GET /groups/{group_key}), con fallback
      // interno al nombre de convenio más corto si TERCEROS no tiene
      // la empresa. Nunca es null si hay al menos una variante.
      const companyName: string | undefined = result.company_name;

      setVariantsByGroup((prev) => ({
        ...prev,
        [groupKey]: variants,
      }));

      if (companyName) {
        setCompanyNameByGroup((prev) => ({
          ...prev,
          [groupKey]: companyName,
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingGroup(null);
    }
  };

  return { variantsByGroup, companyNameByGroup, loadingGroup, fetchVariants };
};
