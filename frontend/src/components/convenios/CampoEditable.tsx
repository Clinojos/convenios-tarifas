"use client";

interface CampoEditableProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
}

export function CampoEditable({ label, value, onChange }: CampoEditableProps) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-slate-400 font-medium">{label}</p>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-0.5 w-full text-[12px] text-navy border border-slate-200 rounded px-1.5 py-1 outline-none focus:border-primary"
      />
    </div>
  );
}