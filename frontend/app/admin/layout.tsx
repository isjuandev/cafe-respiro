"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import router from "next/router";
import { FaFilm, FaCalendarAlt, FaTicketAlt, FaChartBar, FaLightbulb, FaUsers, FaClock, FaCog, FaHome, FaSignOutAlt, FaCoffee } from "react-icons/fa";

async function logout() {
  await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
  router.push("/admin/login");
}

function Sidebar({ active }: { active: string }) {
  const linkClass = (href: string, isActive: boolean) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
      isActive ? "bg-[#E8B86A]/15 text-[#E8B86A] font-medium" : "text-white/60 hover:bg-white/5 hover:text-white"
    }`;

  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-[220px] flex-col border-r border-white/5 bg-[#0A0A0A] lg:flex">
      <div className="flex h-[64px] shrink-0 items-center gap-3 border-b border-white/5 px-5">
        <div className="flex h-8 w-8 items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 36 36" fill="none">
            <path d="M6 10C6 10 6 22 10 25C14 28 22 28 26 25C30 22 30 10 30 10H6Z" stroke="#E8B86A" strokeWidth="1.5" fill="none" />
            <path d="M30 12C32.5 13 33.5 16 32 18C30.5 20 28 19 26 17" stroke="#E8B86A" strokeWidth="1.5" fill="none" />
          </svg>
        </div>
        <div className="leading-none">
          <div className="text-[10px] tracking-[0.2em] text-white">CAFÉ</div>
          <div className="text-sm font-bold tracking-[0.12em] text-white">RESPIRO</div>
          <div className="text-[8px] tracking-[0.2em] text-[#E8B86A]">CINE & CAFÉ</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        <Link href="/admin" className={linkClass("/admin", active === "dashboard")}>
          <FaHome className="text-sm" /> Dashboard
        </Link>
        <Link href="/admin/peliculas" className={linkClass("/admin/peliculas", active === "peliculas")}>
          <FaFilm /> Películas
        </Link>
        <Link href="/admin/funciones" className={linkClass("/admin/funciones", active === "funciones")}>
          <FaCalendarAlt /> Funciones
        </Link>
        <Link href="/admin/reservas" className={linkClass("/admin/reservas", active === "reservas")}>
          <FaTicketAlt /> Reservas
        </Link>
        <Link href="/admin/votaciones" className={linkClass("/admin/votaciones", active === "votaciones")}>
          <FaChartBar /> Votaciones
        </Link>
        <Link href="/admin/sugerencias" className={linkClass("/admin/sugerencias", active === "sugerencias")}>
          <FaLightbulb /> Sugerencias
        </Link>
        <Link href="/admin/menu" className={linkClass("/admin/menu", active === "menu")}>
          <FaCoffee /> Menú
        </Link>
        <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/20">
          <FaUsers className="text-white/20" /> Clientes
        </div>
        <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/20">
          <FaClock className="text-white/20" /> Reportes
        </div>
        <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/20">
          <FaCog className="text-white/20" /> Configuración
        </div>
      </nav>

      <div className="border-t border-white/5 p-3">
        <div className="flex items-center gap-3 rounded-lg bg-white/[0.03] px-3 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E8B86A]/20 text-sm font-bold text-[#E8B86A]">A</div>
          <div className="flex-1">
            <div className="text-sm font-medium text-white">Admin</div>
            <div className="text-xs text-white/40">Administrador</div>
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
    <button onClick={logout} className="mt-3 flex w-full items-center gap-2 px-3 py-2 text-xs text-white/40 hover:text-white">
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
  // Capitaliza primera letra: martes, 27 de mayo de 2025 -> Martes, 27 de mayo de 2025
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
  const isLogin = pathname === "/admin/login";

  if (isLogin) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-[#050507] text-white">
      <Sidebar active={pathname.startsWith("/admin/peliculas") || pathname.startsWith("/admin/biblioteca") ? "peliculas" : pathname.startsWith("/admin/menu") ? "menu" : pathname.startsWith("/admin/funciones") ? "funciones" : pathname.startsWith("/admin/reservas") ? "reservas" : pathname.startsWith("/admin/votaciones") ? "votaciones" : pathname.startsWith("/admin/sugerencias") ? "sugerencias" : "dashboard"} />
      <div className="flex min-h-screen flex-1 flex-col lg:pl-[220px]">
        <header className="sticky top-0 z-10 flex h-[64px] shrink-0 items-center justify-between border-b border-white/5 bg-[#050507]/80 backdrop-blur px-6">
          <div>
            <h1 className="text-xl font-bold text-white">{pathname === "/admin" ? "Dashboard" : pathname.split("/").filter(Boolean).pop()?.replace(/^./, (value) => value.toUpperCase())}</h1>
            <p className="text-xs text-[#E8B86A]">Café Respiro · Administración</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 text-xs text-white/60 sm:flex">
              <FaCalendarAlt /> <LiveDate />
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70">
              <FaCalendarAlt /> <LiveHoy />
            </div>
            <button onClick={logout} className="hidden items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-white/60 hover:text-white lg:flex">
              <FaSignOutAlt /> Cerrar sesión
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-x-hidden overflow-y-auto">
          <div className="p-4 sm:p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
