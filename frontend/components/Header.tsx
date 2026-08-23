"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const linkClass = (href: string) =>
    `relative py-2 text-sm font-medium tracking-wide transition-colors ${isActive(href) ? "text-white" : "text-white/70 hover:text-white"}`;

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#050507]/80 backdrop-blur-md">
      <div className="mx-auto flex h-[64px] max-w-[1280px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 10C6 10 6 22 10 25C14 28 22 28 26 25C30 22 30 10 30 10H6Z" stroke="#E8B86A" strokeWidth="1.5" fill="none" />
              <path d="M30 12C32.5 13 33.5 16 32 18C30.5 20 28 19 26 17" stroke="#E8B86A" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              <path d="M12 6C12 6 13 8 12 10" stroke="#E8B86A" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
              <path d="M16 4C16 4 17.5 6.5 16 9" stroke="#E8B86A" strokeWidth="1.2" strokeLinecap="round" opacity="0.9" />
              <path d="M20 6C20 6 21 8 20 10" stroke="#E8B86A" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
            </svg>
          </div>
          <div className="leading-none">
            <div className="text-[11px] font-light tracking-[0.3em] text-white">CAFÉ</div>
            <div className="text-[16px] font-bold tracking-[0.15em] text-white">RESPIRO</div>
            <div className="text-[9px] font-medium tracking-[0.25em] text-[#E8B86A]">CINE & CAFÉ</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link href="/" className={linkClass("/")}>
            Cartelera
            {isActive("/") && <span className="absolute bottom-0 left-0 h-[2px] w-full bg-[#E8B86A]" />}
          </Link>
          <Link href="/votar" className={linkClass("/votar")}>
            Votar
            {isActive("/votar") && <span className="absolute bottom-0 left-0 h-[2px] w-full bg-[#E8B86A]" />}
          </Link>
          <Link href="/sugerencias" className={linkClass("/sugerencias")}>
            Sugerir
            {isActive("/sugerencias") && <span className="absolute bottom-0 left-0 h-[2px] w-full bg-[#E8B86A]" />}
          </Link>
          <Link href="/" className="py-2 text-sm font-medium tracking-wide text-white/70 hover:text-white">
            Mis reservas
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <nav className="flex items-center gap-4 md:hidden">
            <Link href={pathname === "/" ? "/votar" : "/"} className="text-sm font-medium text-white">
              {pathname === "/" ? "Votar" : "Cartelera"}
            </Link>
          </nav>
          <Link
            href="/admin/login"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-white/80 hover:border-white/40 hover:text-white"
            aria-label="Perfil"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="8" r="4.5" />
              <path d="M4 20c1.5-3 4.5-5 8-5s6.5 2 8 5" />
              <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
            </svg>
          </Link>
        </div>
      </div>
    </header>
  );
}
