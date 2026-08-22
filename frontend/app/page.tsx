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

  // Reserva por funcion
  const [reservaForm, setReservaForm] = useState<Record<string, { nombre: string; contacto: string; cantidad: number }>>({});
  const [reservaLoading, setReservaLoading] = useState<Record<string, boolean>>({});
  const [reservaError, setReservaError] = useState<Record<string, string | null>>({});
  const [reservaSuccess, setReservaSuccess] = useState<Record<string, string | null>>({});
  const [expandedReserva, setExpandedReserva] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/funciones");
      if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
      const data = await res.json();
      setFunciones(data.funciones);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleReservar(funcionId: string) {
    const f = reservaForm[funcionId] || { nombre: "", contacto: "", cantidad: 1 };
    if (f.nombre.trim().length < 2) {
      setReservaError((p) => ({ ...p, [funcionId]: "Nombre mínimo 2 caracteres" }));
      return;
    }
    if (f.contacto.trim().length < 2) {
      setReservaError((p) => ({ ...p, [funcionId]: "Contacto obligatorio" }));
      return;
    }
    if (!Number.isInteger(f.cantidad) || f.cantidad < 1 || f.cantidad > 10) {
      setReservaError((p) => ({ ...p, [funcionId]: "Cantidad debe ser 1-10" }));
      return;
    }
    try {
      setReservaLoading((p) => ({ ...p, [funcionId]: true }));
      setReservaError((p) => ({ ...p, [funcionId]: null }));
      setReservaSuccess((p) => ({ ...p, [funcionId]: null }));
      const res = await fetch(`/api/funciones/${funcionId}/reservas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: f.nombre.trim(), contacto: f.contacto.trim(), cantidad: f.cantidad }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = Array.isArray(data.message) ? data.message.join(", ") : data.message || `Error ${res.status}`;
        throw new Error(msg);
      }
      setReservaSuccess((p) => ({ ...p, [funcionId]: `¡Reserva confirmada! Cupos restantes: ${data.cuposDisponibles}` }));
      setExpandedReserva(null);
      // Revalidar cupos
      load();
    } catch (err) {
      setReservaError((p) => ({ ...p, [funcionId]: err instanceof Error ? err.message : "Error" }));
    } finally {
      setReservaLoading((p) => ({ ...p, [funcionId]: false }));
    }
  }

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
        <Button className="mt-4" variant="outline" onClick={load}>
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
        <p className="mt-1 text-muted-foreground">Funciones programadas — reserva tu cupo</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {funciones.map((f) => {
          const lleno = f.cuposDisponibles <= 0;
          const expanded = expandedReserva === f.id;
          return (
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
                  <span className={lleno ? "text-destructive font-medium" : "text-green-600 font-medium"}>
                    {f.cuposDisponibles} disponibles
                  </span>{" "}
                  <span className="text-muted-foreground">de {f.cupoTotal}</span>
                </p>
              </div>

              {reservaSuccess[f.id] && (
                <div className="mt-3 rounded border border-green-600 bg-green-50 p-2 text-xs text-green-700">
                  {reservaSuccess[f.id]}
                </div>
              )}
              {reservaError[f.id] && (
                <div className="mt-3 rounded border border-destructive bg-destructive/10 p-2 text-xs text-destructive">
                  {reservaError[f.id]}
                </div>
              )}

              {lleno ? (
                <div className="mt-4 rounded bg-destructive/10 px-3 py-2 text-center text-sm font-medium text-destructive">
                  Cupo lleno
                </div>
              ) : expanded ? (
                <div className="mt-4 space-y-2 rounded border bg-muted/50 p-3">
                  <input
                    className="w-full rounded border bg-background px-2 py-1 text-sm"
                    placeholder="Tu nombre"
                    value={reservaForm[f.id]?.nombre || ""}
                    onChange={(e) => setReservaForm((p) => ({ ...p, [f.id]: { ...p[f.id], nombre: e.target.value, contacto: p[f.id]?.contacto || "", cantidad: p[f.id]?.cantidad || 1 } }))}
                  />
                  <input
                    className="w-full rounded border bg-background px-2 py-1 text-sm"
                    placeholder="Tu contacto (email/tel)"
                    value={reservaForm[f.id]?.contacto || ""}
                    onChange={(e) => setReservaForm((p) => ({ ...p, [f.id]: { ...p[f.id], contacto: e.target.value, nombre: p[f.id]?.nombre || "", cantidad: p[f.id]?.cantidad || 1 } }))}
                  />
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium">Personas:</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      className="w-20 rounded border bg-background px-2 py-1 text-sm"
                      value={reservaForm[f.id]?.cantidad ?? 1}
                      onChange={(e) => setReservaForm((p) => ({ ...p, [f.id]: { ...p[f.id], cantidad: parseInt(e.target.value) || 1, nombre: p[f.id]?.nombre || "", contacto: p[f.id]?.contacto || "" } }))}
                    />
                    <span className="text-xs text-muted-foreground">1-10</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setExpandedReserva(null)}>
                      Cancelar
                    </Button>
                    <Button size="sm" disabled={!!reservaLoading[f.id]} onClick={() => handleReservar(f.id)}>
                      {reservaLoading[f.id] ? "Reservando…" : "Confirmar reserva"}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button className="mt-4" onClick={() => setExpandedReserva(f.id)}>
                  Reservar
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
