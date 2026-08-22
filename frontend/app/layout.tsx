import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "Café Respiro | Cine & Café",
  description: "Sugiere películas, vota y reserva tu cupo para las funciones de Café Respiro. Cine-café en la ciudad.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body className="min-h-screen bg-[#050507] text-white antialiased">
        <Header />
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
