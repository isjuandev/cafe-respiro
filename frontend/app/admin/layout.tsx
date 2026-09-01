"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FaFilm,
  FaCalendarAlt,
  FaTicketAlt,
  FaChartBar,
  FaLightbulb,
  FaUsers,
  FaClock,
  FaCog,
  FaHome,
  FaSignOutAlt,
  FaCoffee,
} from "react-icons/fa";

function Sidebar({ active }: { active: string }) {
  const linkClass = (href: string, isActive: boolean) =>
    `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
      isActive
        ? "bg-[#E8B86A]/10 text-[#E8B86A] border border-[#E8B86A]/20"
        : "text-white/60 hover:bg-white/5 hover:text-white border border-transparent"
    }`;

  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-[230px] flex-col border-r border-white/10 bg-[#09090C] lg:flex">
      {/* Brand */}
      <div className="flex h-[68px] shrink-0 items-center gap-3 border-b border-white/10 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E8B86A]/20 bg-[#E8B86A]/5">
          <svg width="24" height="24" viewBox="0 0 36 36" fill="none">
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
            />
          </svg>
        </div>
        <div className="leading-none">
          <div className="text-[10px] font-medium tracking-[0.25em] text-[#E8B86A]">CAFÉ</div>
          <div className="text-sm font-black tracking-[0.12em] text-white">RESPIRO</div>
          <div className="text-[8px] tracking-[0.2em] text-white/40">ADMIN PANEL</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto p-3.5">
        <Link href="/admin" className={linkClass("/admin", active === "dashboard")}>
          <FaHome className="text-sm" /> Dashboard
        </Link>
        <Link href="/admin/peliculas" className={linkClass("/admin/peliculas", active === "peliculas")}>
          <FaFilm className="text-sm" /> Películas
        </Link>
        <Link href="/admin/funciones" className={linkClass("/admin/funciones", active === "funciones")}>
          <FaCalendarAlt className="text-sm" /> Funciones
        </Link>
        <Link href="/admin/reservas" className={linkClass("/admin/reservas", active === "reservas")}>
          <FaTicketAlt className="text-sm" /> Reservas
        </Link>
        <Link href="/admin/votaciones" className={linkClass("/admin/votaciones", active === "votaciones")}>
          <FaChartBar className="text-sm" /> Votaciones
        </Link>
        <Link href="/admin/sugerencias" className={linkClass("/admin/sugerencias", active === "sugerencias")}>
          <FaLightbulb className="text-sm" /> Sugerencias
        </Link>
        <Link href="/admin/menu" className={linkClass("/admin/menu", active === "menu")}>
          <FaCoffee className="text-sm" /> Menú
        </Link>
        <div className="pt-2">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white/40 hover:text-[#E8B86A] hover:bg-white/5 transition-colors"
          >
            ← Ver Sitio Público
          </Link>
        </div>
      </nav>

      {/* Footer Profile */}
      <div className="border-t border-white/10 p-3.5">
        <div className="flex items-center gap-3 rounded-xl bg-white/[0.02] border border-white/5 p-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#E8B86A]/20 text-xs font-bold text-[#E8B86A]">
            A
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-white truncate">Staff Respiro</div>
            <div className="text-[10px] text-white/40">Administrador</div>
          </div>
        </div>
        <LogoutButton />
      </div>
    </aside>
  );
}

function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    router.push("/admin/login");
  }
  return (
    <button
      onClick={logout}
      className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300 hover:bg-red-500/20 hover:text-white transition-colors"
    >
      <FaSignOutAlt /> Cerrar sesión
    </button>
  );
}

function LiveDate() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(id);
  }, []);
  if (!now) return <span>—</span>;
  const formatted = new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);
  const withCap = formatted.charAt(0).toUpperCase() + formatted.slice(1);
  return <>{withCap}</>;
}

function LiveHoy() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(id);
  }, []);
  if (!now) return <>Hoy</>;
  const short = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short" }).format(now);
  return <>Hoy · {short}</>;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/admin/login";

  async function logout() {
    if (typeof window !== "undefined") {
      sessionStorage.clear();
      localStorage.clear();
    }
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    window.location.href = "/admin/login";
  }

  if (isLogin) {
    return <>{children}</>;
  }

  const activeSection =
    pathname.startsWith("/admin/peliculas") || pathname.startsWith("/admin/biblioteca")
      ? "peliculas"
      : pathname.startsWith("/admin/menu")
      ? "menu"
      : pathname.startsWith("/admin/funciones")
      ? "funciones"
      : pathname.startsWith("/admin/reservas")
      ? "reservas"
      : pathname.startsWith("/admin/votaciones")
      ? "votaciones"
      : pathname.startsWith("/admin/sugerencias")
      ? "sugerencias"
      : "dashboard";

  const sectionTitles: Record<string, string> = {
    dashboard: "Panel de Control",
    peliculas: "Catálogo de Películas",
    funciones: "Funciones y Aforo",
    reservas: "Control de Reservas y Pagos",
    votaciones: "Votaciones del Cineclub",
    sugerencias: "Sugerencias de la Comunidad",
    menu: "Carta y Restaurante",
  };

  return (
    <div className="flex min-h-screen bg-[#070709] text-white">
      <Sidebar active={activeSection} />

      <div className="flex min-h-screen flex-1 flex-col lg:pl-[230px]">
        <header className="sticky top-0 z-10 flex h-[68px] shrink-0 items-center justify-between border-b border-white/10 bg-[#070709] px-6">
          <div>
            <h1 className="text-lg font-black text-white font-serif">
              {sectionTitles[activeSection] || "Administración"}
            </h1>
            <p className="text-xs text-[#E8B86A]">Café Respiro · Gestión Operativa</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 text-xs text-white/60 sm:flex">
              <FaCalendarAlt className="text-[#E8B86A]" /> <LiveDate />
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#111114] px-3 py-1.5 text-xs text-white/70">
              <FaCalendarAlt className="text-[#E8B86A]" /> <LiveHoy />
            </div>
            <button
              onClick={logout}
              className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-bold text-white/70 hover:text-white hover:bg-white/10 transition-colors lg:flex"
            >
              <FaSignOutAlt /> Salir
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-x-hidden overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
