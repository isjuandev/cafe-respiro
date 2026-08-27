"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Reserva = { id: string; cantidad: number; createdAt: string; funcion: { fechaHora: string; cupoTotal: number; pelicula: { titulo: string; sinopsis?: string | null } } };

export default function DashboardPage() {
  const router = useRouter();
  const [reservas, setReservas] = useState<Reserva[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try { setError(null); const res = await fetch("/api/mis-reservas", { credentials: "include" }); if (res.status === 401 || res.status === 403) { router.push("/login"); return; } if (!res.ok) throw new Error("No se pudieron cargar tus reservas"); const data = await res.json(); setReservas(data.reservas || []); }
    catch (e) { setError(e instanceof Error ? e.message : "No se pudieron cargar tus reservas"); }
  }
  useEffect(() => { load(); }, []);

  return <div className="bg-[#050507] px-4 py-12 text-white sm:px-6 lg:px-8"><main className="mx-auto max-w-[900px]"><div className="mb-6"><p className="text-xs font-bold tracking-[0.2em] text-[#E8B86A]">MI EXPERIENCIA</p><h1 className="mt-2 text-3xl font-bold">Mis reservas</h1><p className="mt-2 text-sm text-white/60">Tus próximas funciones, en un solo lugar.</p></div>{reservas === null && !error && <div className="space-y-3" aria-label="Cargando reservas"><div className="h-32 animate-pulse rounded-xl bg-white/5" /><div className="h-32 animate-pulse rounded-xl bg-white/5" /></div>}{error && <div className="rounded-xl bg-red-500/10 p-6 text-center" role="alert"><p className="text-red-300">{error}</p><button onClick={load} className="mt-3 rounded-lg bg-white px-4 py-2 text-sm font-bold text-black">Reintentar</button></div>}{reservas && reservas.length === 0 && <div className="surface-card p-8 text-center"><p className="text-white/70">Aún no tienes reservas.</p><Link href="/" className="mt-4 inline-flex rounded-lg bg-[#E8B86A] px-4 py-2 text-sm font-bold text-black">Explorar cartelera</Link></div>}{reservas && reservas.length > 0 && <div className="space-y-4">{reservas.map((reserva) => { const date = new Date(reserva.funcion.fechaHora); return <article key={reserva.id} className="surface-card p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold tracking-[0.15em] text-[#E8B86A]">RESERVA CONFIRMADA</p><h2 className="mt-2 text-xl font-bold">{reserva.funcion.pelicula.titulo}</h2></div><span className="rounded-full bg-[#6B8E6B]/20 px-3 py-1 text-xs font-medium text-[#9BC49B]">{reserva.cantidad} {reserva.cantidad === 1 ? "persona" : "personas"}</span></div><div className="mt-5 grid gap-3 text-sm text-white/70 sm:grid-cols-2"><div><span className="block text-xs text-white/40">FECHA</span>{date.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" })}</div><div><span className="block text-xs text-white/40">HORA</span>{date.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}</div></div></article>; })}</div>}</main></div>;
}
