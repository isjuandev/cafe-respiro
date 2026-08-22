import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Café Respiro | Cine-Café",
  description: "Sugiere películas, vota y reserva tu cupo para las funciones de Café Respiro.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
