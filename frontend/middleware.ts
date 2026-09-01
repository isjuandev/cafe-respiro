import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("admin_token")?.value;

  // Rutas de administración protegidas (todo /admin excepto /admin/login)
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!token) {
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
  }

  // Si ya tiene sesión activa y visita páginas de login/registro
  if (token) {
    if (pathname === "/admin/login") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    if (pathname === "/login" || pathname === "/registro") {
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
