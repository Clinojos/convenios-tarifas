// frontend/src/context/AuthContext.tsx
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { API_BASE_URL } from "@/config/api";
import { ENDPOINTS } from "@/config/endpoints";
import { COOKIE_NAME } from "@/config/auth";

type User = {
  id: string;
  name: string;
  initial: string;
  photoUrl: string | null; // 👈 nuevo
};

const defaultUser: User = {
  id: "",
  name: "Usuario",
  initial: "U",
  photoUrl: null, // 👈 nuevo
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
            id: data.user_id || "",
            name: data.name || "Usuario",
            initial: data.initial || (data.name?.charAt(0) || "U").toUpperCase(),
            photoUrl: data.photo_url || null, // 👈 nuevo
          });
        } else {
          console.error("Respuesta /me no OK:", response.status);
        }
      } catch (e) {
        console.error("Error cargando perfil:", e);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useUser() {
  return useContext(AuthContext);
}