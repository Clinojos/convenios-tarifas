export function formatCOP(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

// Deriva un badge de variante a partir del nombre (MENOMB).
// Ajustar/eliminar si el backend termina exponiendo un campo dedicado.
export function guessVariantLabel(name: string): string {
  const upper = name.toUpperCase();
  const hasEps = upper.includes("EPS");
  const hasPac = upper.includes("PAC");
  const hasCirugia = upper.includes("CIRUGIA") || upper.includes("CIRUGÍA");

  const parts: string[] = [];
  if (hasEps) parts.push("EPS");
  if (hasPac) parts.push("PAC");
  if (hasCirugia) parts.push("CIRUGIA");

  return parts.length > 0 ? parts.join(" · ") : "GENERAL";
}
