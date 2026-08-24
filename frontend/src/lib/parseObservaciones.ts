/**
 * parseObservaciones
 * ---------------------------------------------------------------------------
 * Parsea el texto libre del campo "observations" en secciones estructuradas.
 * Formato esperado (cada etiqueta en MAYÚSCULA + ":"):
 *
 * SERVICIOS:
 * texto libre...
 *
 * DOCUMENTOS:
 * - item 1
 * - item 2
 *
 * RADICACION:
 * texto libre...
 *
 * DOC_RADICACION:
 * texto libre...
 *
 * COPAGO:
 * texto libre...
 *
 * AUTORIZACION:
 * texto libre...
 *
 * CONTACTO:
 * Nombre | Cargo | Telefono | Email
 *
 * CONTACTO: (puede repetirse, una tarjeta de contacto por cada aparición)
 * Nombre | Cargo | Telefono | Email
 *
 * Cualquier sección que no aparezca en el texto queda vacía ("" o []),
 * así cada tarjeta puede decidir si mostrar su estado "vacío" habitual.
 */

export interface ParsedContact {
  full_name: string;
  role: string;
  phone: string;
  email: string;
}

export interface ParsedObservaciones {
  observaciones: string;
  direccion: string; // NUEVO
  telefono: string; // NUEVO
  habilitacion: string; // NUEVO
  fechaInicio: string; // NUEVO
  ultimoIncremento: string; // NUEVO
  vencimiento: string; // NUEVO
  prorroga: string; // NUEVO
  servicios: string;
  documentos: string[];
  radicacion: string;
  docRadicacion: string;
  copago: string;
  autorizacion: string;
  contactos: ParsedContact[];
  unparsed: string;
}
const SECTION_KEYS = [
  "OBSERVACIONES",
  "DIRECCION", // NUEVO
  "TELEFONO", // NUEVO
  "HABILITACION", // NUEVO
  "FECHA_INICIO", // NUEVO
  "ULTIMO_INCREMENTO", // NUEVO
  "VENCIMIENTO", // NUEVO
  "PRORROGA", // NUEVO
  "SERVICIOS",
  "DOCUMENTOS",
  "RADICACION",
  "DOC_RADICACION",
  "COPAGO",
  "AUTORIZACION",
  "CONTACTO",
] as const;

type SectionKey = (typeof SECTION_KEYS)[number];

// Línea tipo "ETIQUETA:" o "ETIQUETA: contenido en la misma línea"
const HEADER_RE = /^([A-ZÁÉÍÓÚÑ_]+)\s*:\s*(.*)$/;

const EMPTY_RESULT: ParsedObservaciones = {
  servicios: "",
  documentos: [],
  radicacion: "",
  docRadicacion: "",
  copago: "",
  autorizacion: "",
  contactos: [],
  unparsed: "",
};

function isSectionKey(value: string): value is SectionKey {
  return (SECTION_KEYS as readonly string[]).includes(value);
}

function parseContactLine(line: string): ParsedContact {
  const parts = line.split("|").map((p) => p.trim());
  return {
    full_name: parts[0] ?? "",
    role: parts[1] ?? "",
    phone: parts[2] ?? "",
    email: parts[3] ?? "",
  };
}

export function parseObservaciones(
  text: string | null | undefined,
): ParsedObservaciones {
  if (!text || !text.trim()) return { ...EMPTY_RESULT };

  const buffers: Partial<Record<Exclude<SectionKey, "CONTACTO">, string[]>> =
    {};
  const contactBuffers: string[][] = [];
  const preHeaderLines: string[] = [];

  let current: SectionKey | null = null;

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (line === "") continue;

    const match = line.match(HEADER_RE);
    if (match && isSectionKey(match[1])) {
      current = match[1];
      const inlineContent = match[2];

      if (current === "CONTACTO") {
        contactBuffers.push(inlineContent ? [inlineContent] : []);
      } else {
        if (!buffers[current]) buffers[current] = [];
        if (inlineContent) buffers[current]!.push(inlineContent);
      }
      continue;
    }

    if (current === "CONTACTO") {
      contactBuffers[contactBuffers.length - 1]?.push(line);
    } else if (current) {
      buffers[current] = buffers[current] ?? [];
      buffers[current]!.push(line);
    } else {
      preHeaderLines.push(line);
    }
  }

  return {
    observaciones: (buffers.OBSERVACIONES ?? []).join(" ").trim(),
    direccion: (buffers.DIRECCION ?? []).join(" ").trim(),
    telefono: (buffers.TELEFONO ?? []).join(" ").trim(),
    habilitacion: (buffers.HABILITACION ?? []).join(" ").trim(),
    fechaInicio: (buffers.FECHA_INICIO ?? []).join(" ").trim(),
    ultimoIncremento: (buffers.ULTIMO_INCREMENTO ?? []).join(" ").trim(),
    vencimiento: (buffers.VENCIMIENTO ?? []).join(" ").trim(),
    prorroga: (buffers.PRORROGA ?? []).join(" ").trim(),
    servicios: (buffers.SERVICIOS ?? []).join(" ").trim(),
    docRadicacion: (buffers.DOC_RADICACION ?? []).join(" ").trim(),
    radicacion: (buffers.RADICACION ?? []).join(" ").trim(),
    copago: (buffers.COPAGO ?? []).join(" ").trim(),
    autorizacion: (buffers.AUTORIZACION ?? []).join(" ").trim(),
    documentos: (buffers.DOCUMENTOS ?? [])
      .map((l) => l.replace(/^[-•]\s*/, "").trim())
      .filter(Boolean),
    contactos: contactBuffers
      .map((buf) => parseContactLine(buf.join(" ").trim()))
      .filter((c) => c.full_name !== ""),
    unparsed: preHeaderLines.join("\n"),
  };
}
