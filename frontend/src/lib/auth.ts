// src/lib/auth.ts
import { jwtVerify } from "jose";

// Debe ser la MISMA clave con la que el backend firma el token
// (la que usa create_access_token en tu FastAPI)
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

type AuthResult = {
  auth: boolean;
  role: string | null;
  permissions: string[];
};

export async function isAuthenticated(token?: string): Promise<AuthResult> {
  if (!token) return { auth: false, role: null, permissions: [] };

  try {
    // Verifica firma + expiración localmente, SIN llamar al backend
    const { payload } = await jwtVerify(token, JWT_SECRET);

    return {
      auth: true,
      role: (payload.role as string) || "sin_rol",
      // Requiere que el backend incluya "permissions" en el payload del JWT
      // (mismo array que ya devuelve /auth/me).
      permissions: (payload.permissions as string[]) || [],
    };
  } catch (e) {
    // Firma inválida, token expirado, o malformado
    return { auth: false, role: null, permissions: [] };
  }
}
