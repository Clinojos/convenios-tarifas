"use client";

interface DatoGeneralProps {
  label: string;
  value: string;
  isEditing?: boolean;
  draftValue?: string;
  onChange?: (v: string) => void;
}

export function DatoGeneral({
  label,
  value,
  isEditing,
  draftValue,
  onChange,
}: DatoGeneralProps) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-slate-400 font-medium">{label}</p>
      {isEditing && onChange ? (
        <input
          value={draftValue ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="mt-0.5 w-full text-[12px] text-navy font-medium border border-slate-200 rounded px-1.5 py-0.5 outline-none focus:border-primary"
        />
      ) : (
        <p className="text-[12px] text-navy font-medium mt-0.5">{value}</p>
      )}
    </div>
  );
}