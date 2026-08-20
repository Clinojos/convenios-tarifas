"use client";
import { createContext, useContext, useState } from "react";

const DeleteModalContext = createContext({
  openDeleteModal: (onConfirm: () => void, title: string) => {},
});

export const DeleteModalProvider = ({ children }: { children: React.ReactNode }) => {
  const [modal, setModal] = useState<{ isOpen: boolean; onConfirm: () => void; title: string }>({
    isOpen: false,
    onConfirm: () => {},
    title: "",
  });

  const openDeleteModal = (onConfirm: () => void, title: string) => {
    setModal({ isOpen: true, onConfirm, title });
  };

  return (
    <DeleteModalContext.Provider value={{ openDeleteModal }}>
      {children}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-xl">
            <div className="text-red-500 mb-4 text-4xl">⚠</div>
            <h2 className="text-xl font-bold mb-2">¿Eliminar {modal.title}?</h2>
            <p className="text-gray-500 mb-6 text-sm">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setModal({ ...modal, isOpen: false })} className="flex-1 px-4 py-2 bg-gray-100 rounded-lg">Cancelar</button>
              <button onClick={() => { modal.onConfirm(); setModal({ ...modal, isOpen: false }); }} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </DeleteModalContext.Provider>
  );
};

export const useDeleteModal = () => useContext(DeleteModalContext);