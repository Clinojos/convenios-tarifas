// Ajusta estos tipos si el shape real que devuelve useConvenios() /
// useConvenioVariants() es distinto — están escritos a partir de los campos
// que ya se usaban en la página (g.group_key, g.display_name, etc.).

export interface ConvenioGroup {
  group_key: string;
  display_name: string;
  logo_url?: string | null;
  variant_nits: string[];
  status: string; // "Activo" | "Inactivo" (estado CONTRACTUAL: vigente/vencido)
  total_variants: number;
  modality: string;
  total_procedures: number;

  /** Distingue convenio con tabla de precios propia vs programa de descuento
   *  sobre tarifa particular (spec 0.2, 4.2). Cambia qué bloques se muestran
   *  en la ficha y en la tarjeta. */
  tipo: "tarifario_propio" | "descuento";

  /** Estado del tarifario CARGADO en el sistema — independiente de `status`.
   *  Un convenio puede estar "Activo" contractualmente y aun así no tener
   *  tarifario cargado todavía (spec sección 5 y modelo de datos sec. 6). */
  tarifario_status: "vigente" | "sin_tarifario" | "pendiente_digitacion";

  /** Fecha de vencimiento del convenio. El rango real va de 2001 a 2026
   *  (spec 0.3), así que nunca asumir "la tarifa más reciente" sin este dato. */
  vigencia_fin?: string; // ISO date, ej "2026-12-31"

  /** Solo si tipo === "descuento": porcentaje aplicado sobre la tarifa base. */
  descuento_porcentaje?: number;

  /** Solo si tipo === "descuento": sobre qué tarifa aplica el porcentaje
   *  (ej. "tarifa particular", "PBS"). */
  descuento_aplica_sobre?: string;
}

export interface ConvenioVariant {
  nit: string;
  contract_number: string;
  modality: string;
  status: string;

  /** Mismos campos que en ConvenioGroup pero a nivel de variante individual,
   *  por si dos NITs del mismo convenio tienen tarifarios en estados distintos. */
  tipo?: "tarifario_propio" | "descuento";
  tarifario_status?: "vigente" | "sin_tarifario" | "pendiente_digitacion";
  vigencia_fin?: string;
}
