// app/procedimientos/layout.tsx
import { BreadcrumbProvider } from "@/components/breadcrumb/BreadcrumbContext";
import { BreadcrumbSlot } from "@/components/breadcrumb/BreadcrumbSlot";

export default function ProcedimientosLayout({ children }: { children: React.ReactNode }) {
  return (
    <BreadcrumbProvider>
      <div className="mx-auto flex h-full max-w-[1400px] flex-col gap-4 overflow-hidden p-4 font-sans">
        <BreadcrumbSlot />
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    </BreadcrumbProvider>
  );
}