"use client";

import { 
  AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, 
  Tooltip, XAxis, BarChart, Bar, LineChart, Line 
} from "recharts";
import { Building2, Stethoscope, CheckCircle2, AlertCircle } from "lucide-react";
import { useDashboard } from "@/hooks/useDashboard";

// Clases de utilidad constantes
const cardClass = "p-5 border border-slate-100 rounded-2xl bg-white";
const sectionTitle = "text-[12px] font-medium text-slate-700 mb-4";
const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'];

export default function DashboardPage() {
  const { total: totalProcedures, loading: loadingProcedures } = useDashboard("procedures");
  const { total: totalCompanies, loading: loadingCompanies } = useDashboard("companies");
  return (
    <div className="max-w-[1400px] mx-auto space-y-6 p-6 font-sans">
      
      {/* 1. KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { 
            title: "Convenios activos", 
            val: loadingCompanies ? "..." : totalCompanies.toLocaleString(), 
            icon: Building2, 
            color: "from-blue-500 to-blue-600" 
          },
          { 
            title: "Procedimientos", 
            val: loadingProcedures ? "..." : totalProcedures.toLocaleString(), 
            icon: Stethoscope, 
            color: "from-emerald-400 to-emerald-600" 
          },
          { title: "Sincronización", val: "99.9%", icon: CheckCircle2, color: "from-purple-500 to-purple-600" },
          { title: "Alertas", val: "3", icon: AlertCircle, color: "from-amber-400 to-amber-500" },
        ].map((kpi, i) => (
          <div key={i} className={`relative overflow-hidden p-5 rounded-2xl text-white bg-gradient-to-br ${kpi.color}`}>
            <div className="absolute -right-4 -top-4 w-20 h-20 border-2 border-white rounded-full opacity-20 rotate-45" />
            <kpi.icon size={16} className="mb-2 opacity-80" />
            <p className="text-[10px] font-medium opacity-80 uppercase">{kpi.title}</p>
            <p className="text-lg font-bold mt-0.5">{kpi.val}</p>
          </div>
        ))}
      </div>

      {/* 2. Gráficas */}
      <div className="grid grid-cols-3 gap-6">
        <div className={cardClass}>
          <h3 className={sectionTitle}>Procedimientos por área</h3>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[{n:'Cirugía',v:80}, {n:'Opto',v:60}, {n:'Oftal',v:90}]}>
                <XAxis dataKey="n" fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <Tooltip cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="v" radius={[4,4,0,0]}>
                  {COLORS.map((c, i) => <Cell key={i} fill={c} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={cardClass}>
          <h3 className={sectionTitle}>Distribución eps</h3>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={[{n:'A',v:400},{n:'B',v:300},{n:'C',v:200}]} innerRadius={40} outerRadius={60} dataKey="v">
                  {COLORS.map((c, i) => <Cell key={i} fill={c} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={cardClass}>
          <h3 className={sectionTitle}>Latencia hosvital</h3>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[{n:'8am',v:2}, {n:'10am',v:5}, {n:'12pm',v:1}, {n:'2pm',v:8}]}>
                <XAxis dataKey="n" fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <Line type="monotone" dataKey="v" stroke="#10b981" strokeWidth={2} dot={{r: 3}} />
                <Tooltip />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`${cardClass} col-span-3`}>
          <h3 className={sectionTitle}>Tendencia mensual detallada</h3>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[{n:'Ene',v:40}, {n:'Feb',v:30}, {n:'Mar',v:60}, {n:'Abr',v:80}, {n:'May',v:45}]}>
                <Area type="monotone" dataKey="v" stroke="#3b82f6" fill="#eff6ff" strokeWidth={2} />
                <Tooltip />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}