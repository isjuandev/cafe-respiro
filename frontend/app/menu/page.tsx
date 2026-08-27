"use client";

import { useEffect, useState } from "react";
import { PageHero } from "@/components/PageHero";

type Item = { id: string; nombre: string; descripcion?: string | null; precio: number; orden: number };
type Categoria = { id: string; nombre: string; orden: number; items: Item[] };

const money = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

export default function MenuPage() {
  const [categorias, setCategorias] = useState<Categoria[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setError(null);
      const res = await fetch("/api/menu");
      if (!res.ok) throw new Error("No se pudo cargar el menú");
      const data = await res.json();
      setCategorias(data.categorias || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar el menú");
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="bg-[#050507] text-white">
      <PageHero title="MENÚ" subtitle="CAFÉ, ALGO RICO Y BUEN CINE" description="Disfruta algo preparado con calma antes de que empiece la función." image="https://images.unsplash.com/photo-1511920170033-f8396924c348?w=1600&h=700&fit=crop" alt="Café servido en una mesa" />
      <main className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8" aria-live="polite">
        {categorias === null && !error && <div className="space-y-4" aria-label="Cargando menú"><div className="h-32 animate-pulse rounded-2xl bg-white/5" /><div className="h-48 animate-pulse rounded-2xl bg-white/5" /></div>}
        {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-8 text-center"><p className="text-red-300">{error}</p><button onClick={load} className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-bold text-black">Reintentar</button></div>}
        {categorias && categorias.length === 0 && <div className="surface-card p-10 text-center"><p className="text-white/60">El menú no tiene productos disponibles en este momento.</p></div>}
        {categorias && categorias.length > 0 && <div className="space-y-6">{categorias.map((categoria) => <section key={categoria.id} className="surface-card p-5 sm:p-8" aria-labelledby={`categoria-${categoria.id}`}><div className="flex flex-wrap items-end justify-between gap-3"><h2 id={`categoria-${categoria.id}`} className="text-2xl font-bold">{categoria.nombre}</h2><span className="text-xs text-white/50">Pago en el sitio</span></div><div className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2">{categoria.items.map((item) => <article key={item.id} className="border-b border-white/10 pb-5"><div className="flex items-baseline justify-between gap-4"><h3 className="text-sm font-bold">{item.nombre}</h3><span className="shrink-0 text-sm font-bold text-[#E8B86A]">{money.format(item.precio)}</span></div>{item.descripcion && <p className="mt-1 text-sm leading-relaxed text-white/60">{item.descripcion}</p>}</article>)}</div></section>)}</div>}
      </main>
    </div>
  );
}
