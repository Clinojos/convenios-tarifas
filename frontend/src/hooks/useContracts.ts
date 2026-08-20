// frontend/src/hooks/useContracts.ts
import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/config/api";
import { ENDPOINTS } from "@/config/endpoints";
import { COOKIE_NAME } from "@/config/auth"; // 👈 agregado

export function useContracts() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Intentamos obtener el token de las cookies
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${COOKIE_NAME}=`))
      ?.split("=")[1];

    if (!token) {
      setError("No has iniciado sesión o el token ha expirado.");
      setLoading(false);
      return;
    }

    // 2. Realizamos la petición usando las constantes centralizadas
    fetch(`${API_BASE_URL}${ENDPOINTS.CONTRACTS}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          if (res.status === 401) throw new Error("Sesión expirada");
          throw new Error("Error al obtener los datos");
        }
        return res.json();
      })
      .then((data) => setData(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}
