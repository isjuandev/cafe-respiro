import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function getRoleFromToken(token?: string): "admin" | "cliente" | null {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const parsed = JSON.parse(jsonPayload);
    return parsed.role || null;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("admin_token")?.value;
  const role = getRoleFromToken(token);

  // Rutas de administración protegidas (todo /admin excepto /admin/login)
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!token || role !== "admin") {
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Dashboard de cliente protegido (/dashboard)
  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
    // Si es admin, redirigir al panel de administración para evitar loop
    if (role === "admin") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  // Si ya tiene sesión activa y visita páginas de login/registro
  if (token) {
    if (pathname === "/admin/login") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    if (pathname === "/login" || pathname === "/registro") {
      if (role === "admin") {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/login",
    "/registro",
  ],
};
