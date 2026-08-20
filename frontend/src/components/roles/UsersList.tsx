"use client";

import { ChevronRight, User, Shield, Search } from "lucide-react";
import { HighlightText } from "@/utils/highlight"
import { EmptyState } from "@/components/ui/EmptyState";; 

interface UsersGridProps {
  users: any[];
  onSelect: (user: any) => void;
  searchQuery?: string;
}

export default function UsersGrid({ users, onSelect, searchQuery = "" }: UsersGridProps) {
  if (!users || users.length === 0) {
    return (
      <EmptyState 
        title="Sin usuarios encontrados" 
        message="No hay usuarios disponibles con esos filtros." 
        icon={Search} 
      />
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden font-sans">
      {users.map((u: any) => {
        const roleName = u.role ? u.role.name : "Sin rol";
        const hasRole = !!u.role;
        
        return (
          <div 
            key={u.id}
            onClick={() => onSelect(u)}
            className="flex items-center justify-between px-6 py-4 border-b border-slate-50 last:border-0 hover:bg-primary/5 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-full ${hasRole ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-400"}`}>
                {hasRole ? <Shield size={16} /> : <User size={16} />}
              </div>
              <div className="flex flex-col">
                <p className="text-[12px] font-medium uppercase text-navy">
                  <HighlightText text={u.id} highlight={searchQuery} />
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">{roleName}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                u.isPending ? "text-orange" : "text-green"
              }`}>
                {u.isPending ? "Pendiente" : "Activo"}
              </span>
              <ChevronRight size={16} className="text-slate-300" />
            </div>
          </div>
        );
      })}
    </div>
  );
}