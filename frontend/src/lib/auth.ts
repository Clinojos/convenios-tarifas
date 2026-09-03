// src/lib/auth.ts
import { jwtVerify } from "jose";

// Debe ser la MISMA clave con la que el backend firma el token
// (la que usa create_access_token en tu FastAPI)
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function isAuthenticated(token?: string) {
  if (!token) return { auth: false, role: null };

  try {
    // Verifica firma + expiración localmente, SIN llamar al backend
    const { payload } = await jwtVerify(token, JWT_SECRET);

    return {
      auth: true,
      role: (payload.role as string) || "sin_rol",
    };
  } catch (e) {
    // Firma inválida, token expirado, o malformado
    return { auth: false, role: null };
  }
}
