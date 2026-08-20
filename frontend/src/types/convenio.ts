export interface ConvenioGroup {
  group_key: string;
  display_name: string;
  status: string; // "Activo" | "Inactivo"
  total_variants: number;
  variant_keys: string[]; // MENNIT de cada variante — así lo manda el backend
  modality: string;
  logo_url: string | null;
  avatar_color: string;
  type: string | null; // hoy siempre null hasta que se cargue en agreement_meta
  total_procedures: number;
  active_variants: number;
  // Estos 4 campos NO existen todavía en el backend (agreement_meta no los tiene).
  // Se dejan opcionales para no romper si algún día se agregan, pero por ahora
  // siempre van a venir undefined — el componente debe manejar eso.
  tarifario_status?: "cargado" | "sin_tarifario" | "pendiente_digitacion";
  vigencia_fin?: string | null;
  descuento_porcentaje?: number | null;
  descuento_aplica_sobre?: string | null;
}

export interface ConvenioVariantDetail {
  contract_key: string; // así lo manda /groups/{group_key} — no "nit"
  name: string;
  status: string;
  company_nit: string; // así lo manda el backend, no "contract_number"
  modality: string;
  logo_url: string | null;
  avatar_color: string;
  type: string | null;
  total_procedures: number;
}
