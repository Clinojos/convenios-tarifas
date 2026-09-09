"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Building2, Stethoscope,
  LogOut, PanelLeft, Pencil
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

function isNavItemActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

// Avatar reutilizable: muestra la foto si existe, si no, el inicial.
function UserAvatar({
  photoUrl,
  initial,
  size = "w-7 h-7",
}: {
  photoUrl: string | null;
  initial: string;
  size?: string;
}) {
  const [imgError, setImgError] = useState(false);

  if (photoUrl && !imgError) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt="Foto de perfil"
        className={`${size} rounded-full object-cover shrink-0 shadow-sm`}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className={`${size} rounded-full bg-white text-navy flex items-center justify-center text-[10px] font-bold shadow-sm shrink-0`}
    >
      {initial}
    </div>
  );
}

export function Sidebar() {
  const { setIsLoading } = useGlobalLoading();
  const [isMounted, setIsMounted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [savingAlias, setSavingAlias] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { user, loading: userLoading } = useUser();

  useEffect(() => {
    setIsMounted(true);
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
    window.location.href = "/login";
  };

  const getToken = () => {
    return document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${COOKIE_NAME}=`))
      ?.split("=")[1];
  };

  const handleChangeAlias = async () => {
    const newAlias = window.prompt(
      "¿Cómo quieres que aparezca tu nombre?",
      user?.name ?? ""
    );

    if (newAlias === null) return; // el usuario canceló

    const trimmed = newAlias.trim();
    const token = getToken();
    if (!token) return;

    setSavingAlias(true);
    setMenuOpen(false);

    try {
      const response = await fetch(`${API_BASE_URL}${ENDPOINTS.AUTH.ME_ALIAS}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ display_name: trimmed || null }),
      });

      if (response.ok) {
        window.location.reload();
      } else {
        console.error("No se pudo actualizar el alias:", response.status);
      }
    } catch (e) {
      console.error("Error actualizando alias:", e);
    } finally {
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
            className={`absolute bottom-full mb-1 bg-white rounded-lg shadow-xl border border-black/5 py-1 z-20 ${
              collapsed ? "left-1.5 w-44" : "left-2 right-2"
            }`}
          >
            <div className="px-3 py-2 border-b border-black/5 flex items-center gap-2">
              <UserAvatar photoUrl={user?.photoUrl ?? null} initial={user?.initial ?? "U"} size="w-6 h-6" />
              <p className="text-[11px] font-semibold text-[#1E1E1E] truncate">{user?.name}</p>
            </div>
            <button
              onClick={handleChangeAlias}
              disabled={savingAlias}
              className="cursor-pointer w-full flex items-center gap-2 px-3 py-2 text-[11px] text-[#1E1E1E] hover:bg-black/5 transition-colors disabled:opacity-50"
            >
              <Pencil className="w-3.5 h-3.5" />
              {savingAlias ? "Guardando..." : "Cambiar nombre"}
            </button>
            <button
              onClick={handleLogout}
              className="cursor-pointer w-full flex items-center gap-2 px-3 py-2 text-[11px] text-[#D14343] hover:bg-black/5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Cerrar sesión
            </button>
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
                  className={`flex-1 min-w-0 text-left transition-all duration-200 ease-in-out overflow-hidden ${
                    collapsed ? "max-w-0 opacity-0" : "max-w-[140px] opacity-100"
                  }`}
                >
                  <p className="text-[10px] font-bold text-white truncate leading-tight whitespace-nowrap">
                    {user?.name}
                  </p>
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
    </aside>
  );
}