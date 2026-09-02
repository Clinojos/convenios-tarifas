"use client";

import { Breadcrumb } from "@/components/breadcrumb/Breadcrumb";
import { useBreadcrumbValue } from "@/components/breadcrumb/BreadcrumbContext";

// Vive en el layout: esta instancia nunca se desmonta al navegar entre
// /convenios, /convenios/[id] y /convenios/empresa/[groupKey].
// Solo cambian los `items` que recibe.
export function BreadcrumbSlot() {
  const items = useBreadcrumbValue();
  if (items.length === 0) return null;
  return <Breadcrumb items={items} />;
}