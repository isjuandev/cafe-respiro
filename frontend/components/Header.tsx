"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { FaUserCircle, FaSignOutAlt, FaBars, FaTimes } from "react-icons/fa";

interface AuthUser {
  sub?: string;
  contacto?: string;
  nombre?: string;
  role?: "admin" | "cliente";
}

export function Header() {
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user || null);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
    }
    checkAuth();
  }, [pathname]);

  if (pathname.startsWith("/admin")) return null;
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const linkClass = (href: string) =>
    `relative py-1.5 text-sm font-medium tracking-wide transition-colors ${
      isActive(href) ? "text-[#E8B86A] font-bold" : "text-white/70 hover:text-white"
    }`;

  async function handleLogout() {
    try {
      if (typeof window !== "undefined") {
        sessionStorage.clear();
        localStorage.clear();
      }
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      setUser(null);
      window.location.href = "/";
    } catch {
      if (typeof window !== "undefined") {
        sessionStorage.clear();
        localStorage.clear();
      }
      window.location.href = "/";
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#070709]">
      <div className="mx-auto flex h-[68px] max-w-[1280px] items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E8B86A]/20 bg-[#E8B86A]/5 group-hover:border-[#E8B86A]/40 transition-colors">
            <svg width="28" height="28" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M6 10C6 10 6 22 10 25C14 28 22 28 26 25C30 22 30 10 30 10H6Z"
                stroke="#E8B86A"
                strokeWidth="1.6"
                fill="none"
              />
              <path
                d="M30 12C32.5 13 33.5 16 32 18C30.5 20 28 19 26 17"
                stroke="#E8B86A"
                strokeWidth="1.6"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M12 6C12 6 13 8 12 10"
                stroke="#E8B86A"
                strokeWidth="1.4"
                strokeLinecap="round"
                opacity="0.8"
              />
              <path
                d="M16 4C16 4 17.5 6.5 16 9"
                stroke="#E8B86A"
                strokeWidth="1.4"
                strokeLinecap="round"
                opacity="0.9"
              />
              <path
                d="M20 6C20 6 21 8 20 10"
                stroke="#E8B86A"
                strokeWidth="1.4"
                strokeLinecap="round"
                opacity="0.8"
              />
            </svg>
          </div>
          <div className="leading-none">
            <div className="text-[10px] font-medium tracking-[0.25em] text-[#E8B86A]">CAFÉ & CINE</div>
            <div className="text-[17px] font-black tracking-[0.12em] text-white">RESPIRO</div>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-7 lg:gap-9 md:flex">
          <Link href="/" className={linkClass("/")}>
            Cartelera
            {isActive("/") && (
              <span className="absolute bottom-[-18px] left-0 h-[2px] w-full bg-[#E8B86A]" />
            )}
          </Link>
          <Link href="/votar" className={linkClass("/votar")}>
            Votar
            {isActive("/votar") && (
              <span className="absolute bottom-[-18px] left-0 h-[2px] w-full bg-[#E8B86A]" />
            )}
          </Link>
          <Link href="/sugerencias" className={linkClass("/sugerencias")}>
            Sugerir
            {isActive("/sugerencias") && (
              <span className="absolute bottom-[-18px] left-0 h-[2px] w-full bg-[#E8B86A]" />
            )}
          </Link>
          <Link href="/menu" className={linkClass("/menu")}>
            Menú de Especialidad
            {isActive("/menu") && (
              <span className="absolute bottom-[-18px] left-0 h-[2px] w-full bg-[#E8B86A]" />
            )}
          </Link>
          {user?.role === "admin" ? (
            <Link href="/admin" className={linkClass("/admin")}>
              Ir al Panel
              {isActive("/admin") && (
                <span className="absolute bottom-[-18px] left-0 h-[2px] w-full bg-[#E8B86A]" />
              )}
            </Link>
          ) : user?.role === "cliente" ? (
            <Link href="/dashboard" className={linkClass("/dashboard")}>
              Mis Reservas
              {isActive("/dashboard") && (
                <span className="absolute bottom-[-18px] left-0 h-[2px] w-full bg-[#E8B86A]" />
              )}
            </Link>
          ) : (
            <Link href="/mis-reservas" className={linkClass("/mis-reservas")}>
              Mis Reservas
              {isActive("/mis-reservas") && (
                <span className="absolute bottom-[-18px] left-0 h-[2px] w-full bg-[#E8B86A]" />
              )}
            </Link>
          )}
        </nav>

        {/* User / Action Buttons */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href={user.role === "admin" ? "/admin" : "/dashboard"}
                className="flex items-center gap-2 rounded-xl border border-[#E8B86A]/30 bg-[#E8B86A]/10 px-3.5 py-1.5 text-xs font-bold text-[#E8B86A] hover:bg-[#E8B86A]/20 transition-colors"
                title={user.role === "admin" ? "Panel Administrador" : (user.contacto || "Mi cuenta")}
              >
                <FaUserCircle className="text-sm" />
                <span className="hidden sm:inline max-w-[130px] truncate">
                  {user.role === "admin"
                    ? "Admin"
                    : user.nombre?.split(" ")[0] || user.contacto?.split("@")[0] || "Mi cuenta"}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-300 hover:bg-red-500/20 hover:text-white transition-colors"
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
              >
                <FaSignOutAlt className="text-xs" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-xl border border-white/20 bg-white/5 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-white/10 hover:border-white/40 transition-colors"
              >
                Ingresar
              </Link>
              <Link
                href="/registro"
                className="hidden sm:inline-flex rounded-xl bg-[#E8B86A] px-3.5 py-1.5 text-xs font-bold text-black hover:bg-[#D4A574] transition-colors"
              >
                Crear cuenta
              </Link>
            </div>
          )}

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-white/80 hover:text-white md:hidden"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-white/10 bg-[#0c0c10] px-4 py-4 md:hidden space-y-2">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`block rounded-lg px-3 py-2 text-sm font-medium ${
              isActive("/") ? "bg-[#E8B86A]/10 text-[#E8B86A] font-bold" : "text-white/80"
            }`}
          >
            🎬 Cartelera de Cine
          </Link>
          <Link
            href="/votar"
            onClick={() => setMobileMenuOpen(false)}
            className={`block rounded-lg px-3 py-2 text-sm font-medium ${
              isActive("/votar") ? "bg-[#E8B86A]/10 text-[#E8B86A] font-bold" : "text-white/80"
            }`}
          >
            🗳️ Votar por Películas
          </Link>
          <Link
            href="/sugerencias"
            onClick={() => setMobileMenuOpen(false)}
            className={`block rounded-lg px-3 py-2 text-sm font-medium ${
              isActive("/sugerencias") ? "bg-[#E8B86A]/10 text-[#E8B86A] font-bold" : "text-white/80"
            }`}
          >
            💡 Sugerir una Película
          </Link>
          <Link
            href="/menu"
            onClick={() => setMobileMenuOpen(false)}
            className={`block rounded-lg px-3 py-2 text-sm font-medium ${
              isActive("/menu") ? "bg-[#E8B86A]/10 text-[#E8B86A] font-bold" : "text-white/80"
            }`}
          >
            ☕ Menú de Especialidad
          </Link>
          {user?.role === "admin" ? (
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className={`block rounded-lg px-3 py-2 text-sm font-medium ${
                isActive("/admin") ? "bg-[#E8B86A]/10 text-[#E8B86A] font-bold" : "text-white/80"
              }`}
            >
              ⚙️ Ir al Panel Admin
            </Link>
          ) : user?.role === "cliente" ? (
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className={`block rounded-lg px-3 py-2 text-sm font-medium ${
                isActive("/dashboard") ? "bg-[#E8B86A]/10 text-[#E8B86A] font-bold" : "text-white/80"
              }`}
            >
              🎟️ Mis Reservas
            </Link>
          ) : (
            <Link
              href="/mis-reservas"
              onClick={() => setMobileMenuOpen(false)}
              className={`block rounded-lg px-3 py-2 text-sm font-medium ${
                isActive("/mis-reservas") ? "bg-[#E8B86A]/10 text-[#E8B86A] font-bold" : "text-white/80"
              }`}
            >
              🎟️ Mis Reservas
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
