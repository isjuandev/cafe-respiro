"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Sugerencia = {
  id: string;
  titulo: string;
  comentario?: string | null;
  nombreSolicitante: string;
  estado: string;
  tituloNormalizado: string;
  createdAt: string;
  _count: { votos: number };
};

type Funcion = {
  id: string;
  peliculaId: string;
  pelicula: { titulo: string };
  fechaHora: string;
  cupoTotal: number;
  cuposOcupados?: number;
  cuposDisponibles?: number;
};

export default function AdminPage() {
  const router = useRouter();
  const [auth, setAuth] = useState<boolean | null>(null);
  const [sugerencias, setSugerencias] = useState<Sugerencia[] | null>(null);
  const [funciones, setFunciones] = useState<Funcion[] | null>(null);
  const [reservas, setReservas] = useState<any | null>(null);
  const [selectedFuncion, setSelectedFuncion] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Crear función form
  const [createForm, setCreateForm] = useState({ sugerenciaId: "", fechaHora: "", cupoTotal: 30 });
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  async function checkAuth() {
    const res = await fetch("/api/admin/me", { credentials: "include" });
    if (!res.ok) {
      router.push("/admin/login");
      return false;
    }
    return true;
  }

  async function loadSugerencias() {
    const res = await fetch("/api/admin/sugerencias", { credentials: "include" });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    setSugerencias(data.sugerencias);
  }

  async function loadFunciones() {
    // Reusa endpoint público para listar, luego admin para reservas
    const res = await fetch("/api/funciones", { credentials: "include" });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    setFunciones(data.funciones);
  }

  async function init() {
    try {
      const ok = await checkAuth();
      if (!ok) return;
      setAuth(true);
      await Promise.all([loadSugerencias(), loadFunciones()]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    init();
  }, []);

  async function updateEstado(id: string, estado: string) {
    try {
      const res = await fetch(`/api/admin/sugerencias/${id}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ estado }),
      });
      if (!res.ok) throw new Error(await res.text());
      await loadSugerencias();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error");
    }
  }

  async function crearFuncion(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    setCreateSuccess(null);
    try {
      const res = await fetch("/api/admin/funciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          sugerenciaId: createForm.sugerenciaId,
          fechaHora: new Date(createForm.fechaHora).toISOString(),
          cupoTotal: Number(createForm.cupoTotal),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || await res.text());
      setCreateSuccess(`Función creada: ${data.funcion.id}`);
      await loadFunciones();
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Error");
    }
  }

  async function verReservas(funcionId: string) {
    setSelectedFuncion(funcionId);
    try {
      const res = await fetch(`/api/admin/funciones/${funcionId}/reservas`, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setReservas(data);
    } catch (e) {
      setReservas({ error: e instanceof Error ? e.message : "Error" });
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    router.push("/admin/login");
  }

  if (loading) return <p className="p-8 text-center text-muted-foreground">Cargando panel…</p>;
  if (auth === false) return null;
  if (error) return <p className="text-destructive">{error}</p>;

  const programadas = sugerencias?.filter((s) => s.estado === "PROGRAMADA") || [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Panel Admin</h1>
          <p className="text-sm text-muted-foreground">Gestión de sugerencias, funciones y reservas</p>
        </div>
        <Button variant="outline" onClick={logout}>
          Salir
        </Button>
      </div>

      {/* Sugerencias */}
      <section className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold">Sugerencias por votos</h2>
        {!sugerencias || sugerencias.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Sin sugerencias</p>
        ) : (
          <div className="mt-4 space-y-2">
            {sugerencias.map((s, idx) => (
              <div key={s.id} className="flex items-center justify-between gap-4 rounded border p-3">
                <div className="flex-1">
                  <p className="font-medium">
                    #{idx + 1} {s.titulo} <span className="text-xs text-muted-foreground">({s._count.votos} votos)</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {s.nombreSolicitante} · {s.estado} · {new Date(s.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <select
                  value={s.estado}
                  onChange={(e) => updateEstado(s.id, e.target.value)}
                  className="rounded border bg-background px-2 py-1 text-xs"
                >
                  <option value="PENDIENTE">PENDIENTE</option>
                  <option value="PROGRAMADA">PROGRAMADA</option>
                  <option value="DESCARTADA">DESCARTADA</option>
                </select>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Crear función */}
      <section className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold">Crear Función desde sugerencia PROGRAMADA</h2>
        <form onSubmit={crearFuncion} className="mt-4 space-y-3">
          <select
            value={createForm.sugerenciaId}
            onChange={(e) => setCreateForm({ ...createForm, sugerenciaId: e.target.value })}
            className="w-full rounded border bg-background px-3 py-2 text-sm"
            required
          >
            <option value="">Selecciona sugerencia PROGRAMADA</option>
            {programadas.map((s) => (
              <option key={s.id} value={s.id}>
                {s.titulo} ({s._count.votos} votos)
              </option>
            ))}
          </select>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium">Fecha y hora</label>
              <input
                type="datetime-local"
                required
                value={createForm.fechaHora}
                onChange={(e) => setCreateForm({ ...createForm, fechaHora: e.target.value })}
                className="mt-1 w-full rounded border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium">Cupo total</label>
              <input
                type="number"
                min={1}
                max={200}
                required
                value={createForm.cupoTotal}
                onChange={(e) => setCreateForm({ ...createForm, cupoTotal: Number(e.target.value) })}
                className="mt-1 w-full rounded border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
          {createError && <p className="text-sm text-destructive">{createError}</p>}
          {createSuccess && <p className="text-sm text-green-600">{createSuccess}</p>}
          <Button type="submit">Crear función</Button>
        </form>
      </section>

      {/* Reservas por función */}
      <section className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold">Reservas por función</h2>
        {!funciones || funciones.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Sin funciones</p>
        ) : (
          <>
            <div className="mt-4 flex flex-wrap gap-2">
              {funciones.map((f) => (
                <Button key={f.id} variant={selectedFuncion === f.id ? "default" : "outline"} size="sm" onClick={() => verReservas(f.id)}>
                  {f.pelicula.titulo} · {new Date(f.fechaHora).toLocaleDateString()} · {f.cuposDisponibles ?? f.cupoTotal} disp.
                </Button>
              ))}
            </div>
            {reservas && (
              <div className="mt-4 rounded border bg-muted/50 p-4">
                {reservas.error ? (
                  <p className="text-sm text-destructive">{reservas.error}</p>
                ) : (
                  <>
                    <p className="text-sm font-medium">
                      {reservas.funcion.pelicula.titulo} — {reservas.funcion.cuposOcupados}/{reservas.funcion.cupoTotal} ocupados
                    </p>
                    {reservas.reservas.length === 0 ? (
                      <p className="mt-2 text-sm text-muted-foreground">Sin reservas aún</p>
                    ) : (
                      <ul className="mt-2 space-y-1 text-sm">
                        {reservas.reservas.map((r: any) => (
                          <li key={r.id} className="flex justify-between rounded bg-background px-2 py-1">
                            <span>
                              {r.nombre} · {r.contacto}
                            </span>
                            <span className="font-medium">{r.cantidad} persona(s)</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}
      </section>

      <p className="text-xs text-muted-foreground">
        Notificaciones: `NotificationLog` stub — ver logs del backend (`docker compose logs backend | grep NOTIFY`). Sin proveedor real en Sprint 3.
      </p>
    </div>
  );
}
