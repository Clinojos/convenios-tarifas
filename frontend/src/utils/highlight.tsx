// src/utils/highlight.tsx
import React from 'react';

export const HighlightText = ({ text, highlight }: { text: string | number | null | undefined, highlight: string }) => {
  const strText = String(text || "");
  
  if (!highlight || highlight.trim() === "") {
    return <span>{strText}</span>;
  }
  
  const parts = strText.split(new RegExp(`(${highlight})`, 'gi'));
  
  return (
    <>
      {parts.map((part, i) => {
        const isMatch = part.toLowerCase() === highlight.toLowerCase();
        
        return isMatch ? (
          // Mantenemos el amarillo, pero sin padding horizontal para que no se separe
          <span key={i} className="bg-yellow-200 text-slate-900 rounded px-0 font-medium">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        );
      })}
    </>
  );
};