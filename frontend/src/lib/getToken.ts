// src/lib/getToken.ts
import { COOKIE_NAME } from "@/config/auth";

export function getToken(): string | undefined {
  if (typeof document === "undefined") return undefined;
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${COOKIE_NAME}=`))
    ?.split("=")[1];
}
