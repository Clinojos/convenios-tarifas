export interface Procedure {
  /** Código único del procedimiento (ej: 010101) */
  code: string;

  /** Nombre descriptivo del procedimiento */
  name: string;

  /** Estado: "Activo" o "Inactivo" */
  status: string;

  /** Restricción de sexo: A (Ambos), M (Masculino), F (Femenino) */
  gender: string;

  /** Edad mínima requerida */
  min_age: number;

  /** Edad máxima permitida */
  max_age: number;

  /** Indica si es atención domiciliaria */
  is_home_care: boolean;

  /** Indica si requiere autorización previa */
  requires_auth: boolean;
}
