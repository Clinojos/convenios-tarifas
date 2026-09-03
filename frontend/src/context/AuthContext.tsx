// frontend/src/context/AuthContext.tsx
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { API_BASE_URL } from "@/config/api";
import { ENDPOINTS } from "@/config/endpoints";
import { COOKIE_NAME } from "@/config/auth";

type User = {
  id: string;
  role: string;
  name: string;
  initial: string;
  permissions: string[];
};

const defaultUser: User = {
  id: "",
  role: "",
  name: "Usuario",
  initial: "U",
  permissions: [],
};

type AuthContextType = {
  user: User;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: defaultUser,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(defaultUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith(`${COOKIE_NAME}=`))
        ?.split("=")[1];

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}${ENDPOINTS.AUTH.ME}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setUser({
            id: data.sub || "",
            role: data.role || "",
            name: data.sub || "Usuario",
            initial: (data.sub?.charAt(0) || "U").toUpperCase(),
            permissions: data.permissions || [],
          });
        }
      } catch (e) {
        console.error("Error cargando perfil:", e);
      } finally {
        setLoading(false);
      }
    };

    // Se ejecuta UNA sola vez para toda la app, sin importar
    // cuántos componentes usen useUser() más abajo.
    loadUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Mismo nombre y misma forma de uso que tu hook anterior,
// así no tienes que tocar los componentes que ya lo usan.
export function useUser() {
  return useContext(AuthContext);
}