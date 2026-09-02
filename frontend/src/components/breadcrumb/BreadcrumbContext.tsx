"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";

export type BreadcrumbItem = {
  id: string;
  label: string;
  icon?: React.ElementType;
  onClick?: () => void;
};

type Ctx = {
  items: BreadcrumbItem[];
  setBreadcrumb: (items: BreadcrumbItem[]) => void;
  // --- memoria de navegación: para que "Inicio"/"Empresa" en el breadcrumb
  // vuelvan a la misma página/filtros donde estaba el usuario, en vez de
  // resetear siempre a la ruta pelada ---
  listUrl: string;
  setListUrl: (url: string) => void;
  empresaUrls: Record<string, string>;
  setEmpresaUrl: (groupKey: string, url: string) => void;
};

const BreadcrumbContext = createContext<Ctx | null>(null);

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<BreadcrumbItem[]>([]);
  const setBreadcrumb = useCallback((newItems: BreadcrumbItem[]) => setItems(newItems), []);

  // Última URL completa (con page/filtros) vista en la lista de la sección
  // (convenios, procedimientos, etc). Vacío por defecto: cada page.tsx hace
  // su propio fallback a la ruta base de su sección cuando todavía no hay
  // nada guardado (ej: se entró directo al detalle desde el buscador
  // global, sin pasar antes por el listado). Antes esto arrancaba
  // hardcodeado en "/convenios", lo que hacía que "Inicio" en el detalle
  // de un procedimiento (con listUrl aún sin setear) te mandara a
  // convenios por error.
  const [listUrl, setListUrl] = useState("");

  // Última URL completa por empresa visitada (cada una tiene su propia
  // paginación en /convenios/empresa/[groupKey])
  const [empresaUrls, setEmpresaUrls] = useState<Record<string, string>>({});
  const setEmpresaUrl = useCallback((groupKey: string, url: string) => {
    setEmpresaUrls((prev) => ({ ...prev, [groupKey]: url }));
  }, []);

  return (
    <BreadcrumbContext.Provider
      value={{ items, setBreadcrumb, listUrl, setListUrl, empresaUrls, setEmpresaUrl }}
    >
      {children}
    </BreadcrumbContext.Provider>
  );
}

// Cada page.tsx llama esto con sus items apenas los tiene listos.
export function useBreadcrumb(items: BreadcrumbItem[]) {
  const ctx = useContext(BreadcrumbContext);
  if (!ctx) throw new Error("useBreadcrumb debe usarse dentro de <BreadcrumbProvider>");

  const { setBreadcrumb } = ctx;
  // Serializamos solo id/label/hasOnClick para no re-disparar el efecto en
  // cada render (items es un array nuevo cada vez, funciones incluidas).
  const key = JSON.stringify(items.map((i) => ({ id: i.id, label: i.label, hasClick: !!i.onClick })));

  useEffect(() => {
    setBreadcrumb(items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}

export function useBreadcrumbValue() {
  const ctx = useContext(BreadcrumbContext);
  if (!ctx) throw new Error("useBreadcrumbValue debe usarse dentro de <BreadcrumbProvider>");
  return ctx.items;
}

// Acceso a la memoria de navegación (para que el breadcrumb no pierda el
// lugar: página, filtros, búsqueda, etc.)
export function useBreadcrumbNav() {
  const ctx = useContext(BreadcrumbContext);
  if (!ctx) throw new Error("useBreadcrumbNav debe usarse dentro de <BreadcrumbProvider>");
  return {
    listUrl: ctx.listUrl,
    setListUrl: ctx.setListUrl,
    getEmpresaUrl: (groupKey: string) => ctx.empresaUrls[groupKey],
    setEmpresaUrl: ctx.setEmpresaUrl,
  };
}