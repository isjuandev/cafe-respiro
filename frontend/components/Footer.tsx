"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaInstagram, FaTiktok, FaWhatsapp, FaMapMarkerAlt, FaClock, FaFilm, FaCoffee, FaGamepad } from "react-icons/fa";

export function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="border-t border-white/10 bg-[#060608] pt-14 pb-10 text-white">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 pb-12 border-b border-white/5">
          {/* Col 1: Brand & Concept */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E8B86A]/30 bg-[#E8B86A]/10">
                <svg width="24" height="24" viewBox="0 0 36 36" fill="none">
                  <path d="M6 10C6 10 6 22 10 25C14 28 22 28 26 25C30 22 30 10 30 10H6Z" stroke="#E8B86A" strokeWidth="1.6" fill="none" />
                  <path d="M30 12C32.5 13 33.5 16 32 18C30.5 20 28 19 26 17" stroke="#E8B86A" strokeWidth="1.6" fill="none" />
                </svg>
              </div>
              <div>
                <span className="text-sm font-black tracking-widest text-white">CINE CAFÉ RESPIRO</span>
                <span className="block text-[10px] text-[#E8B86A] font-medium tracking-wider">CINE, CAFÉ & JUEGOS DE MESA</span>
              </div>
            </div>
            <p className="text-xs text-white/60 leading-relaxed">
              Una pausa con plan en Armenia. Restaurante, cafetería de especialidad y sala de cine boutique de 16 sillas para disfrutar películas de cerca.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <a
                href="https://www.instagram.com/cafe.respiro.armenia/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/80 hover:text-[#E8B86A] hover:border-[#E8B86A]/40 transition-colors"
                aria-label="Instagram"
              >
                <FaInstagram className="text-sm" />
              </a>
              <a
                href="https://www.tiktok.com/@cafe.respiro.armenia"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/80 hover:text-[#E8B86A] hover:border-[#E8B86A]/40 transition-colors"
                aria-label="TikTok"
              >
                <FaTiktok className="text-sm" />
              </a>
              <a
                href="https://wa.me/573019761947"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/80 hover:text-[#E8B86A] hover:border-[#E8B86A]/40 transition-colors"
                aria-label="WhatsApp"
              >
                <FaWhatsapp className="text-sm" />
              </a>
            </div>
          </div>

          {/* Col 2: Experiencia */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#E8B86A]">Experiencia</h4>
            <ul className="space-y-2 text-xs text-white/70">
              <li>
                <Link href="/" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <FaFilm className="text-[10px] text-[#E8B86A]" /> Cartelera Semanal (7:00 PM)
                </Link>
              </li>
              <li>
                <Link href="/votar" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <span className="text-[10px] text-[#E8B86A]">●</span> Votación de Películas
                </Link>
              </li>
              <li>
                <Link href="/sugerencias" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <span className="text-[10px] text-[#E8B86A]">●</span> Proponer una Película
                </Link>
              </li>
              <li>
                <Link href="/menu" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <FaCoffee className="text-[10px] text-[#E8B86A]" /> Menú de Cafetería & Restaurante
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Horarios & Sala */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#E8B86A]">Horarios & Sala</h4>
            <div className="space-y-2 text-xs text-white/70">
              <div className="flex items-start gap-2">
                <FaClock className="text-[#E8B86A] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">Miércoles a Domingo</p>
                  <p className="text-white/50">Restaurante & Juegos: 3:00 PM – 10:00 PM</p>
                  <p className="text-[#E8B86A] font-medium">Función de Cine: 7:00 PM</p>
                </div>
              </div>
              <p className="text-[11px] text-white/50 pt-1">
                Ingreso a sala permitido hasta 25 min tras el inicio.
              </p>
            </div>
          </div>

          {/* Col 4: Ubicación Real */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#E8B86A]">Ubicación</h4>
            <a
              href="https://maps.app.goo.gl/aEezKSuhd2vFm6Z26"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-2 text-xs text-white/70 hover:text-white transition-colors"
            >
              <FaMapMarkerAlt className="text-[#E8B86A] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">Calle 9 # 13-29</p>
                <p className="text-white/50">Armenia, Quindío · Colombia</p>
                <span className="text-[10px] text-[#E8B86A] underline">Ver en Google Maps →</span>
              </div>
            </a>
            <p className="text-[11px] text-white/40 pt-1">
              WhatsApp: +57 301 9761947
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 sm:flex-row text-xs text-white/40">
          <p>© {new Date().getFullYear()} Cine Café Respiro Armenia. Respira, disfruta y déjate sorprender.</p>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-white/70 transition-colors">
              Acceso Clientes
            </Link>
            <span>·</span>
            <Link href="/admin/login" className="hover:text-[#E8B86A] transition-colors">
              Panel Administrativo
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
