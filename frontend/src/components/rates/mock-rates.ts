// TODO(rates-backend): borrar este archivo entero cuando exista
// hooks/useConvenioRates.ts consumiendo routes/rates.py
// (join MAEPRO + PORTAR1 + PORTAR + TARIFAS + HOMPROC + MAEEMP31 + MAEEMP)
export interface MockRate {
  code: string;
  procedure: string;
  rate: string;
  price: number;
  reqAuth: boolean;
}

export const mockRatesByNit: Record<string, MockRate[]> = {
  // clave = NIT de la variante (Convenio.nit), no el group_key
  "999": [
    {
      code: "090101",
      procedure: "Drenaje en la Glándula Lagrimal",
      rate: "Particulares",
      price: 203500,
      reqAuth: false,
    },
  ],
};
