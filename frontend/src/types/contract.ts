// src/types/contract.ts
export interface Contract {
  id: string | number;
  name: string;
  eps: string;
  service_code?: string;
  description?: string;
  // Añade estas líneas:
  active_contracts?: number;
  alerts?: number;
}
