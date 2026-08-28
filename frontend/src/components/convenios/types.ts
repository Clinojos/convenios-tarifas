// Ajusta estos tipos si el shape real que devuelve useConvenios() /
// useConvenioVariants() es distinto — están escritos a partir de los campos
// que ya se usaban en la página (g.group_key, g.display_name, etc.).

export interface ConvenioGroup {
  group_key: string;
  display_name: string;
  logo_url?: string | null;
  variant_nits: string[];
  status: string;
  total_variants: number;
  modality: string;
  total_procedures: number;
  tipo: "tarifario_propio" | "descuento";
  tarifario_status: "vigente" | "sin_tarifario" | "pendiente_digitacion";
  vigencia_fin?: string;
  descuento_porcentaje?: number;
  descuento_aplica_sobre?: string;

  /** Cuando hay una búsqueda activa (?q=...) y el backend encontró el match
   *  DENTRO de un convenio/variante de este grupo (no en el nombre de la
   *  empresa), debe devolver esto para que la card pueda mostrar un aviso
   *  tipo "Coincidencia: {matched_variant_name}". Si el match fue por el
   *  nombre de la empresa misma, no hace falta mandar estos campos. */
  matched_variant_names?: string[];
  matched_variant_key?: string;
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
