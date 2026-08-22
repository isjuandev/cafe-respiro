import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-bold tracking-tight">
            Café Respiro <span className="font-light text-muted-foreground">· Cine-Café</span>
          </h1>
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">
            Sprint 0 · Infraestructura OK
          </span>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
        <div className="rounded-full border bg-muted px-4 py-1.5 text-sm">
          Monorepo + Docker + NestJS + Next.js + Prisma · Proxy /api
        </div>
        <h2 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          Sugiere películas, vota y reserva tu lugar.
        </h2>
        <p className="max-w-xl text-lg text-muted-foreground">
          Plataforma en construcción. El backend está corriendo en{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-sm">/api/health</code> vía proxy
          de Next.js. Sprint 0 completo — sin features, solo arquitectura.
        </p>
        <div className="flex gap-3">
          <Button size="lg">Próximamente</Button>
          <Button variant="outline" size="lg" asChild>
            <a href="/api/health" target="_blank" rel="noreferrer">
              Ver API Health
            </a>
          </Button>
        </div>

        <div className="mt-8 grid w-full max-w-3xl grid-cols-1 gap-4 text-left sm:grid-cols-3">
          <div className="rounded-lg border p-4">
            <h3 className="font-semibold">Sugerencias</h3>
            <p className="text-sm text-muted-foreground">Propón la próxima película del ciclo.</p>
          </div>
          <div className="rounded-lg border p-4">
            <h3 className="font-semibold">Votaciones</h3>
            <p className="text-sm text-muted-foreground">Vota con tu nombre y contacto.</p>
          </div>
          <div className="rounded-lg border p-4">
            <h3 className="font-semibold">Reservas</h3>
            <p className="text-sm text-muted-foreground">Asegura tu cupo para la función.</p>
          </div>
        </div>
      </section>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        Café Respiro — Sprint 0 · {new Date().getFullYear()} · Proxy rewrites activo
      </footer>
    </main>
  );
}
