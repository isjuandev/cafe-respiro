import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Sprint 0: frontend consume la API vía proxy de Next.js (/api/* -> backend)
// No se usa NEXT_PUBLIC_API_URL para evitar rebuild al cambiar URL en Coolify.
// Todas las llamadas usan ruta relativa /api.
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = path.startsWith("/api") ? path : `/api${path.startsWith("/") ? "" : "/"}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}
