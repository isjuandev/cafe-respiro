import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Café Respiro | Cine & Café",
  description: "Sugiere películas, vota y reserva tu cupo para las funciones de Café Respiro. Cine-café en la ciudad.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body className="flex min-h-screen flex-col bg-[#050507] text-white antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
