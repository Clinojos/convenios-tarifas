import { BreadcrumbProvider } from "./BreadcrumbContext";
import { BreadcrumbSlot } from "./BreadcrumbSlot";

// Wrapper único para las 3 rutas de convenios. Antes cada page.tsx repetía
// "mx-auto max-w-[1400px] flex flex-col gap-4 overflow-hidden p-4 font-sans"
// por su cuenta — ahora vive acá una sola vez, junto con el breadcrumb.
//
// h-full (NO h-dvh): esta sección vive dentro de <main> del DashboardLayout,
// que ya tiene su propio alto (viewport - padding). h-dvh se pasaría del
// espacio real y haría scrollear "main" completo en vez del panel interno.
export default function ConveniosLayout({ children }: { children: React.ReactNode }) {
  return (
    <BreadcrumbProvider>
      <div className="mx-auto flex h-full max-w-[1400px] flex-col gap-4 overflow-hidden p-4 font-sans">
        <BreadcrumbSlot />
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    </BreadcrumbProvider>
  );
}