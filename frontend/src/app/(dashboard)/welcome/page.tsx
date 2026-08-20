"use client";

export default function WelcomePage() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[500px] text-center px-6 font-sans">
      <div className="w-full max-w-lg flex flex-col items-center animate-in fade-in duration-500">

        {/* Ícono central */}
        <div className="w-20 h-20 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mb-8">
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
            <path d="M3 9a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v9a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-9z" />
            <path d="M8 7v-2a2 2 0 0 1 2 -2h4a2 2 0 0 1 2 2v2" />
            <path d="M12 12v4" /><path d="M10 14h4" />
          </svg>
        </div>

        {/* Pill de sesión activa */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-4 py-1.5 mb-7">
          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-medium text-blue-600">
            HC
          </div>
          <span className="text-[12px] text-slate-500">Sesión activa</span>
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
        </div>

        {/* Título */}
        <h1 className="text-[18px] font-medium text-slate-900 mb-1">
          Bienvenido a Hosvital
        </h1>
        <p className="text-[12.5px] text-slate-400 mb-6">
          Sistema de gestión de contratos
        </p>

        {/* Divider */}
        <div className="w-8 h-[1.5px] bg-slate-200 rounded-full mb-6" />

        {/* Descripción */}
        <p className="text-[13px] text-slate-500 leading-relaxed max-w-[340px] mb-9">
          Acceso habilitado al módulo de{" "}
          <strong className="text-slate-700 font-medium">Gestión de Contratos</strong>.{" "}
          Usa el menú lateral para navegar entre los módulos disponibles según tu perfil.
        </p>

        {/* Módulos */}
        <div className="grid grid-cols-4 gap-2.5 w-full">
          {[
            { label: "Contratos", icon: "📄" },
            { label: "Procedimientos", icon: "🩺" },
            { label: "Usuarios", icon: "👥" },
            { label: "Reportes", icon: "📊" },
          ].map(({ label, icon }) => (
            <div
              key={label}
              className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col items-center gap-2 hover:border-slate-300 transition-colors cursor-default"
            >
              <span className="text-lg">{icon}</span>
              <span className="text-[11px] text-slate-500 font-medium">{label}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}