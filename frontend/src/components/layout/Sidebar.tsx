"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FileText, Building2, Stethoscope,
  LogOut, ShieldCheck, Users, PanelLeft
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { usePermissions } from "@/hooks/usePermissions";
import { useGlobalLoading } from "@/context/LoadingContext";
import IconButton from "@/components/ui/IconButton";
import { COOKIE_NAME } from "@/config/auth";

const navItems = [
  { label: "Inicio", href: "/dashboard", icon: LayoutDashboard, requiredPermission: "" },
  { label: "Convenios", href: "/convenios", icon: Building2, requiredPermission: "agreement:view" },
  { label: "Procedimientos", href: "/procedimientos", icon: Stethoscope, requiredPermission: "procedures:view" },
  /*{ label: "Tarifas y Servicios", href: "/tariffs", icon: FileText, requiredPermission: "tariffs:view" },*/
  { label: "Roles y Permisos", href: "/roles", icon: ShieldCheck, requiredPermission: "roles:view" },
  { label: "Usuarios", href: "/users", icon: Users, requiredPermission: "users:view" },
];

const COLLAPSED_WIDTH = "w-12"; // 48px
const EXPANDED_WIDTH = "w-[200px]";

// Un item queda "activo" si la ruta actual es exactamente su href, o si es una
// subruta suya (ej. /convenios/compensar-eps-principal debe marcar "Convenios").
// "/dashboard" no usa startsWith porque, si no, marcaría cualquier ruta que
// empezara por "/dashboard-algo"; con "/" ni siquiera aplica por ser el único
// nivel raíz real del listado, así que basta comparar con "/" + "/".
function isNavItemActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const { setIsLoading } = useGlobalLoading();
  const [isMounted, setIsMounted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { user, loading: userLoading } = useUser();
  const { hasPermission, loading: permsLoading } = usePermissions();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isLoading = !isMounted || userLoading || permsLoading;

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

  return (
    <aside
      className={`relative shrink-0 flex flex-col h-screen bg-gradient-to-b from-primary to-navy transition-[width] duration-200 ease-in-out ${
        collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH
      }`}
    >
      {/* Wrapper solo para recortar los blobs decorativos, sin afectar tooltips */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-6 -right-8 w-28 h-28 bg-white/10 rounded-full animate-blob-float" />
        <div className="absolute top-1/2 -left-10 w-24 h-24 bg-white/10 rounded-full animate-blob-float [animation-delay:2s]" />
        <div className="absolute -bottom-10 -right-6 w-20 h-20 bg-white/10 rounded-full animate-blob-float [animation-delay:4s]" />
      </div>

      {/* Logo / toggle */}
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
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 py-1.5 animate-pulse ${collapsed ? "justify-center" : "px-3"}`}
            >
              <div className="w-4 h-4 bg-white/15 rounded" />
              {!collapsed && <div className="h-3 w-20 bg-white/15 rounded" />}
            </div>
          ))
        ) : (
          navItems
            .filter((item) => !item.requiredPermission || hasPermission(item.requiredPermission))
            .map((item) => {
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
            <div className="px-3 py-2 border-b border-black/5">
              <p className="text-[11px] font-semibold text-[#1E1E1E] truncate">{user?.name}</p>
              <p className="text-[10px] text-black/40 truncate uppercase tracking-wide">{user?.role || "Sin rol"}</p>
            </div>
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
                <div className="w-7 h-7 rounded-full bg-white text-navy flex items-center justify-center text-[10px] font-bold shadow-sm shrink-0">
                  {user?.initial}
                </div>
                <div
                  className={`flex-1 min-w-0 text-left transition-all duration-200 ease-in-out overflow-hidden ${
                    collapsed ? "max-w-0 opacity-0" : "max-w-[140px] opacity-100"
                  }`}
                >
                  <p className="text-[10px] font-bold text-white truncate leading-tight whitespace-nowrap">
                    {user?.name}
                  </p>
                  <p className="text-[9px] text-white/60 truncate uppercase whitespace-nowrap">
                    {user?.role || "Sin rol"}
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