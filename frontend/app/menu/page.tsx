"use client";

import { useEffect, useState, useMemo } from "react";
import { PageHero } from "@/components/PageHero";
import {
  FaCoffee,
  FaUtensils,
  FaCocktail,
  FaCookieBite,
  FaSearch,
  FaTimes,
  FaWhatsapp,
  FaStar,
  FaFire,
} from "react-icons/fa";

interface MenuItem {
  id: string;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  imagenUrl?: string | null;
  orden: number;
}

interface MenuCategory {
  id: string;
  nombre: string;
  orden: number;
  items: MenuItem[];
}

const moneyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export default function MenuPage() {
  const [categorias, setCategorias] = useState<MenuCategory[] | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  async function loadMenu() {
    try {
      setError(null);
      const res = await fetch("/api/menu");
      if (!res.ok) throw new Error("No se pudo cargar la carta del menú");
      const data = await res.json();
      setCategorias(data.categorias || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar el menú");
    }
  }

  useEffect(() => {
    loadMenu();
  }, []);

  const totalCount = useMemo(() => {
    if (!categorias) return 0;
    return categorias.reduce((acc, cat) => acc + cat.items.length, 0);
  }, [categorias]);

  const filteredCategories = useMemo(() => {
    if (!categorias) return [];
    return categorias
      .map((cat) => {
        if (activeCategory !== "all" && cat.id !== activeCategory) return null;
        const q = searchTerm.trim().toLowerCase();
        const matchingItems = cat.items.filter((i) => {
          if (!q) return true;
          return (
            i.nombre.toLowerCase().includes(q) ||
            (i.descripcion && i.descripcion.toLowerCase().includes(q))
          );
        });
        if (matchingItems.length === 0) return null;
        return {
          ...cat,
          items: matchingItems,
        };
      })
      .filter(Boolean) as MenuCategory[];
  }, [categorias, activeCategory, searchTerm]);

  function getCategoryIcon(nombre: string) {
    const n = nombre.toUpperCase();
    if (n.includes("COMIDA")) return <FaUtensils className="text-xs" />;
    if (n.includes("CAFÉ") || n.includes("CAFE")) return <FaCoffee className="text-xs" />;
    if (n.includes("POSTRE")) return <FaCookieBite className="text-xs" />;
    if (n.includes("BEBIDAS")) return <FaCocktail className="text-xs" />;
    if (n.includes("CINE")) return <FaStar className="text-xs" />;
    return <FaStar className="text-xs" />;
  }

  return (
    <div className="bg-[#070709] text-white min-h-screen">
      {/* Hero Principal */}
      <PageHero
        title="MENÚ & CARTA"
        subtitle="CINE, CAFÉ & GASTRONOMÍA EN ARMENIA"
        description="Café de especialidad del Quindío, canastas de plátano, sándwiches en pan brioche horneado y picoteo artesanal servido en sala y barra."
        image="https://images.unsplash.com/photo-1511920170033-f8396924c348?w=1600&h=700&fit=crop"
        alt="Barra de café y gastronomía en Café Respiro"
      />

      {/* Franja de Características Boutique */}
      <div className="border-y border-white/10 bg-[#0d0d10] py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#E8B86A]" />
              <span className="text-xs font-semibold text-white/80">Café de Origen Quindío</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#E8B86A]" />
              <span className="text-xs font-semibold text-white/80">Pan Brioche Diario</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#E8B86A]" />
              <span className="text-xs font-semibold text-white/80">Servicio en Sala & Mesa</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#E8B86A]" />
              <span className="text-xs font-semibold text-white/80">Juegos de Mesa desde 3 PM</span>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Barra de Filtros y Buscador */}
        <div className="sticky top-16 z-20 -mx-4 px-4 sm:mx-0 sm:px-0 py-3 bg-[#070709]">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#111114] p-2">
            {/* Pestañas de Categoría con flex-wrap para evitar scroll lateral */}
            <div className="flex flex-wrap items-center gap-1.5 p-1">
              <button
                onClick={() => setActiveCategory("all")}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-colors ${
                  activeCategory === "all"
                    ? "bg-[#E8B86A] text-black"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
              >
                <span>✦</span>
                <span>Todos</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    activeCategory === "all" ? "bg-black/20 text-black font-black" : "bg-white/10 text-white/60"
                  }`}
                >
                  {totalCount}
                </span>
              </button>

              {categorias?.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                      isActive
                        ? "bg-[#E8B86A] text-black shadow-lg shadow-[#E8B86A]/20"
                        : "text-white/70 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {getCategoryIcon(cat.nombre)}
                    <span>{cat.nombre}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                        isActive ? "bg-black/20 text-black font-black" : "bg-white/10 text-white/60"
                      }`}
                    >
                      {cat.items.length}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Buscador reactivo */}
            <div className="relative w-full lg:w-72 shrink-0 px-1 lg:px-0">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-xs" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por plato o café..."
                className="control-dark w-full rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-white/40 focus:border-[#E8B86A]/60 focus:outline-none"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-1"
                >
                  <FaTimes className="text-xs" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Loading state */}
        {categorias === null && !error && (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-80 rounded-3xl bg-white/5 animate-pulse" />
            ))}
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="mt-8 rounded-3xl border border-red-500/20 bg-red-500/10 p-8 text-center max-w-md mx-auto">
            <p className="text-red-300 font-bold">{error}</p>
            <button
              onClick={loadMenu}
              className="mt-4 rounded-xl bg-[#E8B86A] px-5 py-2 text-xs font-bold text-black hover:bg-[#D4A574]"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Empty state */}
        {filteredCategories.length === 0 && categorias !== null && (
          <div className="mt-12 rounded-3xl border border-white/5 bg-[#101014] p-12 text-center max-w-md mx-auto shadow-2xl">
            <FaCoffee className="mx-auto text-4xl text-[#E8B86A]/40 mb-3" />
            <h3 className="text-base font-bold text-white">No se encontraron productos</h3>
            <p className="mt-1 text-xs text-white/50">
              Prueba con otro término de búsqueda o selecciona otra categoría.
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="mt-4 rounded-xl bg-white/10 px-4 py-1.5 text-xs font-bold text-white hover:bg-white/15"
              >
                Limpiar búsqueda
              </button>
            )}
          </div>
        )}

        {/* Listado de Categorías y Tarjetas Estructuradas */}
        {filteredCategories.length > 0 && (
          <div className="mt-6 space-y-12">
            {filteredCategories.map((categoria) => (
              <section key={categoria.id} aria-labelledby={`categoria-${categoria.id}`}>
                {/* Header de Categoría */}
                <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#E8B86A]/10 text-[#E8B86A] border border-[#E8B86A]/20">
                      {getCategoryIcon(categoria.nombre)}
                    </span>
                    <div>
                      <h2
                        id={`categoria-${categoria.id}`}
                        className="text-xl sm:text-2xl font-black tracking-tight text-white font-serif"
                      >
                        {categoria.nombre}
                      </h2>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-white/40">
                    {categoria.items.length} {categoria.items.length === 1 ? "producto" : "productos"}
                  </span>
                </div>

                {/* Grid de Cards */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {categoria.items.map((item) => {
                    const fallbackImg =
                      "https://images.unsplash.com/photo-1509785307050-d4066910ec1e?w=600&h=450&fit=crop";
                    const imgSrc = item.imagenUrl || fallbackImg;

                    return (
                      <article
                        key={item.id}
                        className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0E0E12] transition-all duration-300 hover:-translate-y-1 hover:border-[#E8B86A]/40 hover:shadow-2xl hover:shadow-[#E8B86A]/10"
                      >
                        {/* Contenedor Superior: Imagen & Badges */}
                        <div>
                          <div className="relative aspect-[16/10] w-full overflow-hidden bg-black/60">
                            <img
                              src={imgSrc}
                              alt={item.nombre}
                              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = fallbackImg;
                              }}
                            />
                            {/* Overlay degradado sutil */}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0E0E12] via-transparent to-black/30" />

                            {/* Badge de Precio */}
                            <div className="absolute top-3 right-3">
                              <span className="rounded-full bg-black/90 px-3 py-1 text-xs font-black text-[#E8B86A] border border-[#E8B86A]/30">
                                {moneyFormatter.format(item.precio)}
                              </span>
                            </div>
                          </div>

                          {/* Cuerpo de la Tarjeta */}
                          <div className="p-5">
                            <h3 className="text-base font-bold text-white group-hover:text-[#E8B86A] transition-colors font-serif tracking-tight">
                              {item.nombre}
                            </h3>

                            <p className="mt-2 text-xs leading-relaxed text-white/60 line-clamp-3 min-h-[2.5rem]">
                              {item.descripcion || "Preparación fresca y artesanal servida en barra o en mesa."}
                            </p>
                          </div>
                        </div>

                        {/* Pie de Tarjeta */}
                        <div className="px-5 pb-5 pt-0">
                          <div className="flex items-center justify-between border-t border-white/5 pt-3 text-[11px] text-white/40">
                            <span className="flex items-center gap-1 text-[#E8B86A]/80">
                              <FaStar className="text-[9px]" /> Respiro Especial
                            </span>
                            <span>Barra & Sala</span>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Banner de Contacto y Pedidos Especiales */}
        <div className="mt-16 rounded-3xl border border-[#E8B86A]/25 bg-gradient-to-r from-[#171410] via-[#100F14] to-[#0A0A0E] p-8 sm:p-10 shadow-2xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#E8B86A]/10 px-3 py-1 text-xs font-bold text-[#E8B86A]">
                <FaFire className="text-[10px]" /> Experiencia Café Respiro Armenia
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white font-serif">
                ¿Planeas una tarde de juegos o un evento privado?
              </h3>
              <p className="text-xs sm:text-sm text-white/60 max-w-xl">
                Calle 9 # 13-29, Armenia. Servicio de cafetería, cocina de autor y más de 30 juegos de mesa desde las 3:00 PM.
              </p>
            </div>

            <a
              href="https://wa.me/573019761947?text=Hola%20Café%20Respiro,%20quisiera%20consultar%20sobre%20el%20menú%20y%20mesas"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 rounded-2xl bg-[#E8B86A] px-6 py-3.5 text-xs font-black uppercase tracking-wider text-black hover:bg-[#D4A574] transition-all hover:scale-105 shadow-xl shadow-[#E8B86A]/10 shrink-0"
            >
              <FaWhatsapp className="text-base" /> WhatsApp Oficial
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
