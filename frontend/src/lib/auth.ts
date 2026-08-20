// src/lib/auth.ts
import { API_BASE_URL } from "@/config/api";
import { ENDPOINTS } from "@/config/endpoints";

export async function isAuthenticated(token?: string) {
  if (!token) return { auth: false, role: null };

  try {
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.AUTH.ME}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) return { auth: false, role: null };

    const data = await response.json();
    return { auth: true, role: data.role || "sin_rol" };
  } catch (e) {
    return { auth: false, role: null };
  }
}
