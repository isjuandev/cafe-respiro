"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Pelicula = {
  id: string;
  titulo: string;
  director?: string | null;
  anio?: number | null;
  duracionMin?: number | null;
  sinopsis?: string | null;
};

type Funcion = {
  id: string;
  peliculaId: string;
  pelicula: Pelicula;
  fechaHora: string;
  cupoTotal: number;
  cuposOcupados: number;
  cuposDisponibles: number;
  createdAt: string;
};

function formatFechaHora(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("es-UY", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CarteleraPage() {
  const [funciones, setFunciones] = useState<Funcion[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/funciones");
        if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
        const data = await res.json();
        if (!cancelled) setFunciones(data.funciones);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error desconocido");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-lg border bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-6 text-center">
        <p className="font-medium text-destructive">No se pudo cargar la cartelera</p>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <Button className="mt-4" variant="outline" onClick={() => window.location.reload()}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (!funciones || funciones.length === 0) {
    return (
      <div className="rounded-lg border bg-muted/50 p-8 text-center">
        <h2 className="text-xl font-semibold">Cartelera vacía</h2>
        <p className="mt-2 text-muted-foreground">Aún no hay funciones programadas. ¡Sugiere una película!</p>
        <Button asChild className="mt-4">
          <a href="/sugerencias">Ir a sugerencias</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cartelera</h1>
        <p className="mt-1 text-muted-foreground">Funciones programadas — reserva tu cupo (Sprint 2)</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {funciones.map((f) => (
          <div key={f.id} className="flex flex-col rounded-lg border bg-card p-5 shadow-sm">
            <h3 className="text-lg font-semibold">{f.pelicula.titulo}</h3>
            {f.pelicula.director && (
              <p className="text-sm text-muted-foreground">
                {f.pelicula.director} {f.pelicula.anio ? `· ${f.pelicula.anio}` : ""}
                {f.pelicula.duracionMin ? ` · ${f.pelicula.duracionMin} min` : ""}
              </p>
            )}
            {f.pelicula.sinopsis && (
              <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{f.pelicula.sinopsis}</p>
            )}
            <div className="mt-4 space-y-2 text-sm">
              <p>
                <span className="font-medium">Fecha:</span> {formatFechaHora(f.fechaHora)}
              </p>
              <p>
                <span className="font-medium">Cupos:</span>{" "}
                <span className={f.cuposDisponibles === 0 ? "text-destructive" : "text-green-600"}>
                  {f.cuposDisponibles} disponibles
                </span>{" "}
                <span className="text-muted-foreground">de {f.cupoTotal}</span>
              </p>
            </div>
            <Button className="mt-4" variant="outline" disabled>
              Reservar (Sprint 2)
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
