import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Café Respiro | Cine-Café",
  description: "Sugiere películas, vota y reserva tu cupo para las funciones de Café Respiro.",
};

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      {children}
    </Link>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-background font-sans antialiased">
        <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <Link href="/" className="text-xl font-bold tracking-tight">
              Café Respiro <span className="font-light text-muted-foreground">· Cine-Café</span>
            </Link>
            <nav className="flex items-center gap-1">
              <NavLink href="/">Cartelera</NavLink>
              <NavLink href="/sugerencias">Sugerencias</NavLink>
            </nav>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">{children}</main>
        <footer className="border-t py-6 text-center text-sm text-muted-foreground">
          Café Respiro — Cine-Café · Sprint 1
        </footer>
      </body>
    </html>
  );
}
