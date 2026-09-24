"use client";

import { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";

function LoginContent() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // El hook maneja tanto errores de credenciales como de falta de rol
  const { login, loading, error } = useAuth();

  // Guard contra el bfcache: si Chrome restaura esta página al dar "atrás"
  // (queda congelada con las credenciales escritas y el spinner girando),
  // forzamos una recarga para empezar con el estado limpio y para que el
  // middleware revalide la cookie (si hay sesión válida, redirige al dashboard).
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) window.location.reload();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) return;

    login(identifier, password);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4 font-sans">
      <div className="relative w-full max-w-5xl min-h-[600px] flex rounded-3xl overflow-hidden shadow-2xl shadow-slate-300/40 bg-white">
        
        {/* PANEL IZQUIERDO - MARCA */}
        <div className="relative hidden md:flex md:w-[45%] flex-col justify-between bg-gradient-to-br from-primary to-navy p-10 overflow-hidden">
          
          {/* Blobs decorativos */}
          <div className="absolute -top-10 -right-16 w-64 h-64 bg-white/10 rounded-full animate-blob-float" />
          <div className="absolute top-1/3 -left-14 w-48 h-48 bg-white/10 rounded-full animate-blob-float [animation-delay:2s]" />
          <div className="absolute -bottom-16 right-8 w-56 h-56 bg-white/10 rounded-full animate-blob-float [animation-delay:4s]" />

          {/* Logo sobre tarjeta blanca (mantiene colores originales) */}
          <div className="relative z-10">
            <Image
              src="/logo.png"
              alt="Logo"
              width={160}
              height={44}
              priority
              style={{ height: "auto" }}
              className="object-contain"
            />
          </div>

          {/* Texto central */}
          <div className="relative z-10 space-y-3">
            <h1 className="text-2xl font-bold text-white leading-tight">
              Gestión de Convenios
            </h1>
            <p className="text-[13px] text-white/80 font-medium leading-relaxed max-w-xs">
              Consulta las tarifas vigentes de cada convenio de la clínica en un solo lugar.
            </p>
          </div>

          {/* CLUSTER DE ÍCONOS DECORATIVOS */}
          <div className="relative z-10 flex items-end gap-4">
            {/* Ícono: documento/convenio */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center backdrop-blur-sm">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <path d="M14 2v6h6" />
                  <path d="M9 13h6" />
                  <path d="M9 17h6" />
                </svg>
              </div>
              <span className="text-[10px] font-semibold text-white/70">Convenios</span>
            </div>

            {/* Ícono central: ojo (clínica de ojos), más grande */}
            <div className="flex flex-col items-center gap-2 -mt-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center backdrop-blur-sm shadow-lg shadow-black/10">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <span className="text-[10px] font-semibold text-white/80">Clínica de Ojos</span>
            </div>

            {/* Ícono: aprobado/check */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center backdrop-blur-sm">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 12l2 2 4-4" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
              </div>
              <span className="text-[10px] font-semibold text-white/70">Vigentes</span>
            </div>
          </div>
        </div>

        {/* PANEL DERECHO - FORMULARIO */}
        <div className="relative flex-1 flex flex-col justify-center px-8 sm:px-14 py-12">
          
          {/* Logo visible solo en mobile */}
          <div className="md:hidden mb-8">
            <Image
              src="/logo.png"
              alt="Logo"
              width={120}
              height={40}
              priority
              style={{ height: "auto" }}
              className="object-contain"
            />
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-navy">Bienvenido!</h2>
            <p className="mt-1 text-[13px] text-slate-500 font-medium">
              Ingresa con tu usuario para continuar.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5 max-w-sm w-full">
            <div className="space-y-1.5">
              <label className="block text-[12px] font-bold text-navy ml-1">Usuario</label>
              <input
                type="text"
                placeholder="usuario"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[13px] font-medium text-navy outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-400"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value.toUpperCase())}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[12px] font-bold text-navy ml-1">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-11 text-[13px] font-medium text-navy outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-400"
                  value={password}
                  onChange={(e) => setPassword(e.target.value.toUpperCase())}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 3l18 18M10.58 10.58a2 2 0 002.83 2.83M9.88 4.24A9.12 9.12 0 0112 4c7 0 10 8 10 8a13.16 13.16 0 01-1.67 2.68M6.61 6.61C3.79 8.36 2 12 2 12s3 8 10 8a9.27 9.27 0 005.39-1.61" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-orange/10 border border-orange text-orange-dark text-[12px] font-bold text-center animate-in fade-in zoom-in duration-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="cursor-pointer w-full rounded-xl bg-gradient-to-r from-primary to-navy py-3 text-[13px] font-bold text-white hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-primary/25 mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                </>
              ) : (
                "Entrar"
              )}
            </button>
          </form>

          <div className="mt-10 max-w-sm w-full text-center">
            <p className="text-[12px] font-bold text-slate-700">HOSVITAL - Gestión Manual de contratos</p>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">© 2026 Todos los derechos reservados</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}