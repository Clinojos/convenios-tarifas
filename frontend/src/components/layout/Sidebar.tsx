"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Building2, Stethoscope,
  LogOut, PanelLeft, Pencil, ChevronUp
} from "lucide-react";
import { useUser } from "@/context/AuthContext";
import { useGlobalLoading } from "@/context/LoadingContext";
import IconButton from "@/components/ui/IconButton";
import { COOKIE_NAME } from "@/config/auth";
import { API_BASE_URL } from "@/config/api";
import { ENDPOINTS } from "@/config/endpoints";

const navItems = [
  { label: "Inicio", href: "/dashboard", icon: LayoutDashboard },
  { label: "Convenios", href: "/convenios", icon: Building2 },
  { label: "Procedimientos", href: "/procedimientos", icon: Stethoscope },
  /*{ label: "Tarifas y Servicios", href: "/tariffs", icon: FileText },*/
];

const COLLAPSED_WIDTH = "w-12"; // 48px
const EXPANDED_WIDTH = "w-[200px]";

// Foto de perfil por defecto (estilo "avatar genérico" cuando el usuario no tiene foto propia)
// Colocar el archivo en /public/avatar.png
const DEFAULT_AVATAR_URL = "/avatar.png";

function isNavItemActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

// Avatar reutilizable: foto propia -> imagen genérica por defecto -> inicial (como WhatsApp)
function UserAvatar({
  photoUrl,
  initial,
  size = "w-7 h-7",
  textSize = "text-[10px]",
  ring,
}: {
  photoUrl: string | null;
  initial: string;
  size?: string;
  textSize?: string;
  ring?: string;
}) {
  const [defaultFailed, setDefaultFailed] = useState(false);
  const [customFailed, setCustomFailed] = useState(false);

  const src = photoUrl && !customFailed ? photoUrl : DEFAULT_AVATAR_URL;
  const isDefaultAvatar = src === DEFAULT_AVATAR_URL;

  // Si la foto del usuario falla, intentamos con la genérica.
  // Si la genérica también falla (o no hay foto y la genérica falla), mostramos la inicial.
  const handleError = () => {
    if (photoUrl && !customFailed) {
      setCustomFailed(true);
    } else {
      setDefaultFailed(true);
    }
  };

  const fallbackToInitial = photoUrl ? customFailed && defaultFailed : defaultFailed;

  if (!fallbackToInitial) {
    return (
      // Contenedor circular: recorta a círculo y la imagen llena todo el
      // espacio con object-cover (sin bordes blancos), con un leve zoom
      // extra para que no se vea "flotando" ni con márgenes.
      <div
        className={`${size} rounded-full overflow-hidden shrink-0 shadow-sm ${ring ?? ""}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt="Foto de perfil"
          className={`w-full h-full object-cover ${isDefaultAvatar ? "" : "scale-125"}`}
          onError={handleError}
        />
      </div>
    );
  }

  return (
    <div
      className={`${size} rounded-full bg-white text-navy flex items-center justify-center ${textSize} font-bold shadow-sm shrink-0 ${ring ?? ""}`}
    >
      {initial}
    </div>
  );
}

// Modal reutilizable para cambiar el nombre (alias)
function ChangeAliasModal({
  isOpen,
  currentName,
  saving,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  currentName: string;
  saving: boolean;
  onClose: () => void;
  onSave: (newName: string) => void;
}) {
  const [value, setValue] = useState(currentName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setValue(currentName);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, currentName]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saving) onSave(value.trim());
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] px-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6 animate-modal-pop">
        <div className="flex flex-col items-start gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
            <Pencil className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-[#1E1E1E]">
              Cambiar nombre
            </h2>
            <p className="text-[12px] text-[#6B7280] mt-0.5">
              Elige cómo quieres que aparezca tu nombre en la plataforma.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="block text-[11px] font-semibold text-[#374151] mb-1.5">
            Nombre para mostrar
          </label>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Escribe tu nombre"
            maxLength={60}
            className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2.5 text-[13px] text-[#1E1E1E] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />

          <div className="flex gap-2 mt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="cursor-pointer flex-1 rounded-lg border border-[#D1D5DB] py-2.5 text-[13px] font-semibold text-[#374151] hover:bg-black/5 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="cursor-pointer flex-1 rounded-lg bg-primary py-2.5 text-[13px] font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function Sidebar() {
  const { setIsLoading } = useGlobalLoading();
  const [isMounted, setIsMounted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [savingAlias, setSavingAlias] = useState(false);
  const [aliasModalOpen, setAliasModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { user, loading: userLoading } = useUser();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Guard contra el bfcache: si el navegador restaura esta página al dar
  // "atrás" (por ejemplo después de cerrar sesión), forzamos una recarga para
  // que el middleware vuelva a validar la cookie y redirija al login.
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) window.location.reload();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  const isLoading = !isMounted || userLoading;

  useEffect(() => {
    setIsLoading(isLoading);
  }, [isLoading, setIsLoading]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const handleLogout = () => {
    document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    // replace (no href): reemplaza la entrada actual del historial para que
    // al dar "atrás" no se vuelva al dashboard.
    window.location.replace("/login");
  };

  const getToken = () => {
    return document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${COOKIE_NAME}=`))
      ?.split("=")[1];
  };

  const handleOpenAliasModal = () => {
    setMenuOpen(false);
    setAliasModalOpen(true);
  };

  const handleSaveAlias = async (newAlias: string) => {
    const token = getToken();
    if (!token) return;

    setSavingAlias(true);

    try {
      const response = await fetch(`${API_BASE_URL}${ENDPOINTS.AUTH.ME_ALIAS}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ display_name: newAlias || null }),
      });

      if (response.ok) {
        window.location.reload();
      } else {
        console.error("No se pudo actualizar el alias:", response.status);
        setSavingAlias(false);
      }
    } catch (e) {
      console.error("Error actualizando alias:", e);
      setSavingAlias(false);
    }
  };

  return (
    <aside
      className={`relative shrink-0 flex flex-col h-screen bg-gradient-to-b from-primary to-navy transition-[width] duration-200 ease-in-out ${
        collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH
      }`}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-6 -right-8 w-28 h-28 bg-white/10 rounded-full animate-blob-float" />
        <div className="absolute top-1/2 -left-10 w-24 h-24 bg-white/10 rounded-full animate-blob-float [animation-delay:2s]" />
        <div className="absolute -bottom-10 -right-6 w-20 h-20 bg-white/10 rounded-full animate-blob-float [animation-delay:4s]" />
      </div>

      <div
        className={`relative z-20 border-b border-white/15 flex items-center ${
          collapsed ? "justify-center py-3" : "justify-between px-5 py-6"
        }`}
      >
        {!collapsed && (
          <Image
            src="/logo.png"
            alt="Logo"
            width={120}
            height={40}
            priority
            className="object-contain"
          />
        )}

        <IconButton
          icon={<PanelLeft className="w-4 h-4" />}
          label={collapsed ? "Expandir" : "Contraer"}
          onClick={() => setCollapsed((c) => !c)}
          tooltipPosition="right"
        />
      </div>

      <nav className={`relative z-10 flex-1 py-4 space-y-1 ${collapsed ? "px-1.5" : "px-2"}`}>
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 py-1.5 animate-pulse ${collapsed ? "justify-center" : "px-3"}`}
            >
              <div className="w-4 h-4 bg-white/15 rounded" />
              {!collapsed && <div className="h-3 w-20 bg-white/15 rounded" />}
            </div>
          ))
        ) : (
          navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isNavItemActive(pathname, item.href);

            return (
              <div key={item.href} className="relative group flex items-center">
                <Link
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all w-full overflow-hidden ${
                    isActive
                      ? "bg-white text-navy shadow-md shadow-black/10"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-primary" : "text-white/80"}`} />
                  <span
                    className={`whitespace-nowrap transition-all duration-200 ease-in-out overflow-hidden ${
                      collapsed ? "max-w-0 opacity-0" : "max-w-[140px] opacity-100"
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>

                {collapsed && (
                  <span className="absolute left-full ml-2 scale-0 transition-all rounded-md bg-white border border-[#D9EEF8] px-2 py-1 text-[10px] font-medium text-[#6B9BAE] shadow-sm group-hover:scale-100 whitespace-nowrap z-50">
                    {item.label}
                    <span className="absolute right-full top-1/2 -mt-1 -mr-1 h-2 w-2 rotate-45 bg-white border-l border-b border-[#D9EEF8]" />
                  </span>
                )}
              </div>
            );
          })
        )}
      </nav>

      {/* Footer — info de usuario con menú desplegable */}
      <div ref={menuRef} className="relative z-10 border-t border-white/15">
        {menuOpen && (
          <div
            className={`absolute bottom-full mb-2 bg-white rounded-xl shadow-xl border border-black/5 overflow-hidden z-20 animate-menu-pop origin-bottom ${
              collapsed ? "left-1.5 w-48" : "left-2 right-2"
            }`}
          >
            {/* Encabezado con degradado igual al sidebar, para que combine */}
            <div className="bg-gradient-to-br from-primary to-navy px-3 py-4 flex flex-col items-center gap-2">
              <UserAvatar
                photoUrl={user?.photoUrl ?? null}
                initial={user?.initial ?? "U"}
                size="w-16 h-16"
                textSize="text-lg"
                ring="ring-2 ring-white/40"
              />
              <p className="text-[12px] font-semibold text-white truncate text-center max-w-full">
                {user?.name}
              </p>
            </div>

            <div className="py-1.5">
              {/*
              <button
                onClick={handleOpenAliasModal}
                className="cursor-pointer w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] font-medium text-[#374151] hover:bg-[#F3F4F6] transition-colors"
              >
                <Pencil className="w-3.5 h-3.5 text-primary" />
                Cambiar nombre
              </button>

              */}
              <button
                onClick={handleLogout}
                className="cursor-pointer w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] font-medium text-[#374151] hover:bg-[#F3F4F6] transition-colors"
              >
                <LogOut className="w-3.5 h-3.5 text-navy" />
                Cerrar sesión
              </button>
            </div>
          </div>
        )}

        <div className="relative group flex items-center">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className={`cursor-pointer flex items-center gap-2 py-3 w-full hover:bg-white/10 transition-colors duration-150 overflow-hidden ${
              collapsed ? "justify-center" : "px-4"
            }`}
          >
            {isLoading ? (
              <div className="flex items-center gap-2 w-full animate-pulse">
                <div className="w-7 h-7 rounded-full bg-white/15 shrink-0" />
                {!collapsed && (
                  <div className="flex-1 space-y-1">
                    <div className="h-2 w-16 bg-white/15 rounded" />
                    <div className="h-2 w-24 bg-white/15 rounded" />
                  </div>
                )}
              </div>
            ) : (
              <>
                <UserAvatar photoUrl={user?.photoUrl ?? null} initial={user?.initial ?? "U"} />
                <div
                  className={`flex-1 min-w-0 flex items-center justify-between gap-1 text-left transition-all duration-200 ease-in-out overflow-hidden ${
                    collapsed ? "max-w-0 opacity-0" : "max-w-[140px] opacity-100"
                  }`}
                >
                  <p className="text-[10px] font-bold text-white truncate leading-tight whitespace-nowrap">
                    {user?.name}
                  </p>
                  <ChevronUp
                    className={`w-3 h-3 text-white/70 shrink-0 transition-transform duration-200 ${
                      menuOpen ? "" : "rotate-180"
                    }`}
                  />
                </div>
              </>
            )}
          </button>

          {collapsed && !isLoading && (
            <span className="absolute left-full ml-2 bottom-3 scale-0 transition-all rounded-md bg-white border border-[#D9EEF8] px-2 py-1 text-[10px] font-medium text-[#6B9BAE] shadow-sm group-hover:scale-100 whitespace-nowrap z-50">
              {user?.name}
              <span className="absolute right-full top-1/2 -mt-1 -mr-1 h-2 w-2 rotate-45 bg-white border-l border-b border-[#D9EEF8]" />
            </span>
          )}
        </div>
      </div>

      <ChangeAliasModal
        isOpen={aliasModalOpen}
        currentName={user?.name ?? ""}
        saving={savingAlias}
        onClose={() => {
          if (!savingAlias) setAliasModalOpen(false);
        }}
        onSave={handleSaveAlias}
      />
    </aside>
  );
}