// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { COOKIE_NAME } from "@/config/auth";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const { pathname } = request.nextUrl;

  const { auth } = await isAuthenticated(token);

  // 1. Si ya está autenticado, no dejar entrar al login (sin importar el rol)
  if (auth && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 2. Si no está autenticado y no está en login, redirigir al login
  if (!auth && pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$).*)",
  ],
};
