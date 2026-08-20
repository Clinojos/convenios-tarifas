"use client";

import { X } from "lucide-react";

interface DetailModalProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  gradient: string; // Ejemplo: "from-teal-500 via-emerald-500 to-teal-600"
  onClose: () => void;
  children: React.ReactNode;
}

export function DetailModal({ title, subtitle, icon, gradient, onClose, children }: DetailModalProps) {
  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl relative animate-in zoom-in-95 duration-200 overflow-hidden font-sans">
        {/* Header */}
        <div className={`relative overflow-hidden bg-gradient-to-br ${gradient} px-8 pt-8 pb-10 text-white`}>
          <button onClick={onClose} className="cursor-pointer absolute right-5 top-5 text-white/50 hover:text-white">
            <X size={16} strokeWidth={1.5} />
          </button>
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center mb-5">
            {icon}
          </div>
          <p className="text-[10px] font-medium opacity-80 uppercase tracking-widest">{subtitle}</p>
          <p className="text-xl font-bold mt-1 leading-tight pr-6">{title}</p>
        </div>
        <div className={`h-3 bg-gradient-to-br ${gradient} relative`}>
          <div className="absolute inset-0 bg-white rounded-t-3xl" />
        </div>
        {/* Cuerpo */}
        <div className="px-8 pb-8 space-y-6">{children}</div>
      </div>
    </div>
  );
}