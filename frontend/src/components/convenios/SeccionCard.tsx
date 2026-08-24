"use client";

interface SeccionCardProps {
  icon: React.ReactNode;
  titulo: string;
  children: React.ReactNode;
}

/** Card independiente (Servicios, Documentos, Facturación, Autorización, Contacto) */
export function SeccionCard({ icon, titulo, children }: SeccionCardProps) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4">
      <div className="flex items-center gap-1.5">
        {icon}
        <h2 className="text-[13px] font-semibold text-navy">{titulo}</h2>
      </div>
      <div className="mt-2 text-[12px] text-slate-600">{children}</div>
    </div>
  );
}