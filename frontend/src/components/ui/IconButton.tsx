"use client";

import { ReactNode, useRef, useState } from "react";
import { createPortal } from "react-dom";

type TooltipPosition = "right" | "top" | "left" | "bottom";

type IconButtonProps = {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  type?: "button" | "submit";
  size?: "sm" | "md" | "lg";
  colorClass?: string;
  tooltipPosition?: TooltipPosition;
};

export default function IconButton({
  icon,
  label,
  onClick,
  type = "button",
  size = "sm",
  colorClass = "text-white/60 hover:text-white hover:bg-white/10",
  tooltipPosition = "right",
}: IconButtonProps) {
  const [hovered, setHovered] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  const sizeMap = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-11 h-11",
  };

  const updatePosition = () => {
    const rect = btnRef.current?.getBoundingClientRect();
    if (!rect) return;

    const gap = 8;
    let top = 0;
    let left = 0;

    switch (tooltipPosition) {
      case "right":
        top = rect.top + rect.height / 2;
        left = rect.right + gap;
        break;
      case "left":
        top = rect.top + rect.height / 2;
        left = rect.left - gap;
        break;
      case "top":
        top = rect.top - gap;
        left = rect.left + rect.width / 2;
        break;
      case "bottom":
        top = rect.bottom + gap;
        left = rect.left + rect.width / 2;
        break;
    }

    setCoords({ top, left });
  };

  const handleEnter = () => {
    updatePosition();
    setHovered(true);
  };

  const transformMap: Record<TooltipPosition, string> = {
    right: "translate(0, -50%)",
    left: "translate(-100%, -50%)",
    top: "translate(-50%, -100%)",
    bottom: "translate(-50%, 0)",
  };

  const arrowClassMap: Record<TooltipPosition, string> = {
    right: "absolute right-full top-1/2 -mt-1 -mr-1 h-2 w-2 rotate-45 bg-white border-l border-b border-[#D9EEF8]",
    left: "absolute left-full top-1/2 -mt-1 -ml-1 h-2 w-2 rotate-45 bg-white border-r border-t border-[#D9EEF8]",
    top: "absolute top-full left-1/2 -ml-1 -mt-1 h-2 w-2 rotate-45 bg-white border-r border-b border-[#D9EEF8]",
    bottom: "absolute bottom-full left-1/2 -ml-1 -mb-1 h-2 w-2 rotate-45 bg-white border-l border-t border-[#D9EEF8]",
  };

  return (
    <>
      <div className="relative flex items-center justify-center">
        <button
          ref={btnRef}
          type={type}
          onClick={onClick}
          onMouseEnter={handleEnter}
          onMouseLeave={() => setHovered(false)}
          className={`
            cursor-pointer flex items-center justify-center rounded-md
            transition-colors
            ${sizeMap[size]}
            ${colorClass}
          `}
        >
          {icon}
        </button>
      </div>

      {hovered &&
        typeof document !== "undefined" &&
        createPortal(
          <span
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              transform: transformMap[tooltipPosition],
              zIndex: 9999,
            }}
            className="rounded-md bg-white border border-[#D9EEF8] px-2 py-1 text-[10px] font-medium text-[#6B9BAE] shadow-sm whitespace-nowrap pointer-events-none"
          >
            {label}
            <span className={arrowClassMap[tooltipPosition]} />
          </span>,
          document.body
        )}
    </>
  );
}