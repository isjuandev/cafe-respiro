import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Café Respiro | Cine & Café",
  description: "Sugiere películas, vota y reserva tu cupo para las funciones de Café Respiro. Cine-café en la ciudad.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body className="min-h-screen bg-[#050507] text-white antialiased">
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
              <Link href="/" className="relative py-2 text-sm font-medium tracking-wide text-white">
                Cartelera
                <span className="absolute bottom-0 left-0 h-[2px] w-full bg-[#E8B86A]" />
              </Link>
              <Link href="/sugerencias" className="py-2 text-sm font-medium tracking-wide text-white/70 transition-colors hover:text-white">
                Votar
              </Link>
              <Link href="/sugerencias" className="py-2 text-sm font-medium tracking-wide text-white/70 transition-colors hover:text-white">
                Sugerir
              </Link>
              <Link href="/" className="py-2 text-sm font-medium tracking-wide text-white/70 transition-colors hover:text-white">
                Mis reservas
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <nav className="flex items-center gap-4 md:hidden">
                <Link href="/" className="text-sm font-medium text-white">
                  Cartelera
                </Link>
              </nav>
              <Link
                href="/admin/login"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-white/80 transition-colors hover:border-white/40 hover:text-white"
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
        <main>{children}</main>
        <footer className="border-t border-white/5 bg-[#050507] py-8">
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <div className="flex items-center gap-3">
                <div className="h-6 w-6">
                  <svg viewBox="0 0 36 36" fill="none">
                    <path d="M6 10C6 10 6 22 10 25C14 28 22 28 26 25C30 22 30 10 30 10H6Z" stroke="#E8B86A" strokeWidth="1.3" fill="none" />
                    <path d="M30 12C32.5 13 33.5 16 32 18C30.5 20 28 19 26 17" stroke="#E8B86A" strokeWidth="1.3" fill="none" />
                  </svg>
                </div>
                <span className="text-sm font-medium tracking-wide text-white/60">CAFÉ RESPIRO · CINE & CAFÉ</span>
              </div>
              <p className="text-xs text-white/40">© 2025 Café Respiro. Respira, disfruta y déjate sorprender.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
