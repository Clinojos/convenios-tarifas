"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
}

export function ConfirmModal({ isOpen, onClose, onConfirm, title, description }: ConfirmModalProps) {
  const [mounted, setMounted] = useState(false);

  // Aseguramos que el componente solo se renderice en el cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay oscuro */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-[9999]" 
            onClick={onClose} 
          />
          
          {/* Modal */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-2xl shadow-xl z-[10000] w-full max-w-sm text-center"
          >
            <div className="text-red-500 mb-4 text-4xl">⚠</div>
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
            <p className="text-sm text-slate-500 mb-6">{description}</p>
            <div className="flex gap-3">
              <button 
                onClick={onClose} 
                className="cursor-pointer flex-1 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => { onConfirm(); onClose(); }} 
                className="cursor-pointer flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body // Esto es lo que saca el modal del flujo normal y lo pega en el body
  );
}