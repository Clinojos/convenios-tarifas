import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    // 1. El contenedor padre ocupa toda la pantalla y no deja desbordar nada
    <div className="flex h-screen overflow-hidden bg-[#f4f6fb]">

      {/* 2. Sidebar: es colapsable internamente (maneja su propio ancho con
          transition-[width]), por eso el contenedor padre no necesita saber
          si está expandido o contraído. */}
      <Sidebar />

      {/* 3. Contenedor derecho: crece para ocupar el espacio restante.
          min-w-0 es clave: evita que el contenido interno (tablas, texto largo)
          empuje el layout y rompa el ancho cuando el sidebar cambia de tamaño. */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <Header />

        {/* 4. IMPORTANTE: Esto es lo que permite que el contenido sea scrollable
            sin estirar el layout hacia abajo */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-[95%] mx-auto h-full">
            {children}
          </div>
        </main>
      </div>

    </div>
  );
}