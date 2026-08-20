"use client";

import { motion } from "framer-motion";

interface PageTabsProps {
  activeTab: "roles" | "users";
  onChange: (tab: "roles" | "users") => void;
  showUsersTab: boolean;
}

export default function PageTabs({ activeTab, onChange, showUsersTab }: PageTabsProps) {
  const tabs = [
    { key: "roles" as const, label: "Roles y Permisos" },
    { key: "users" as const, label: "Usuarios" },
  ];

  return (
    <div className="flex border-b border-divider">
      {tabs.map((tab) => {
        if (tab.key === "users" && !showUsersTab) return null;
        
        const isActive = activeTab === tab.key;
        
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className="cursor-pointer relative py-4 px-8 transition-all duration-300 outline-none group text-center whitespace-nowrap"
          >
            <span className={`block text-[10px] font-medium uppercase tracking-wider transition-colors duration-200
              ${isActive ? "text-primary" : "text-muted opacity-80 group-hover:text-slate-600"}`}>
              {tab.label}
            </span>
            
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}