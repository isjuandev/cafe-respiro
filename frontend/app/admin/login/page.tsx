"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaLock, FaArrowRight } from "react-icons/fa";

export default function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ usuario: form.username, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Credenciales inválidas");
      window.location.href = data.role === "cliente" ? "/dashboard" : "/admin";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-[#070709]">
      {/* Left - Branding / Image */}
      <div className="hidden w-[50%] flex-col justify-between overflow-hidden border-r border-white/10 bg-[#09090C] lg:flex">
        <div className="relative flex-1">
          <img
            src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=900&h=1000&fit=crop"
            alt="Cine"
            className="absolute inset-0 h-full w-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090C] via-[#09090C]/60 to-transparent" />
          <div className="relative flex h-full flex-col p-10">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E8B86A]/20 bg-[#E8B86A]/5">
                <svg width="24" height="24" viewBox="0 0 36 36" fill="none">
                  <path d="M6 10C6 10 6 22 10 25C14 28 22 28 26 25C30 22 30 10 30 10H6Z" stroke="#E8B86A" strokeWidth="1.6" fill="none" />
                  <path d="M30 12C32.5 13 33.5 16 32 18C30.5 20 28 19 26 17" stroke="#E8B86A" strokeWidth="1.6" fill="none" />
                </svg>
              </div>
              <div className="leading-none">
                <div className="text-[10px] font-medium tracking-[0.25em] text-[#E8B86A]">CAFÉ</div>
                <div className="text-sm font-black tracking-[0.12em] text-white">RESPIRO</div>
                <div className="text-[8px] tracking-[0.2em] text-white/40">ADMIN PANEL</div>
              </div>
            </Link>

            <div className="mt-auto space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#16161A] px-3.5 py-1 text-xs text-white/80">
                <span className="h-2 w-2 rounded-full bg-[#E8B86A]" />
                Panel Administrativo Seguro
              </div>
              <h1 className="text-3xl font-black text-white font-serif leading-tight">
                Gestión Operativa de <br />
                <span className="text-[#E8B86A]">Café Respiro</span>
              </h1>
              <p className="text-xs text-white/60 leading-relaxed max-w-sm">
                Control de funciones, taquilla boutique, votaciones comunitarias y carta de alimentos.
              </p>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 bg-[#09090C] px-10 py-4 text-xs text-white/40 flex justify-between">
          <span>Calle 9 # 13-29 Armenia, Quindío</span>
          <span>Café Respiro S.A.S.</span>
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex flex-1 flex-col bg-[#070709]">
        <div className="flex flex-1 items-center justify-center p-6 sm:p-8">
          <div className="w-full max-w-[380px]">
            <div className="mb-8 lg:hidden">
              <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/40 hover:text-[#E8B86A]">
                ← Volver a la cartelera
              </Link>
            </div>

            <div className="hidden items-center justify-between lg:flex">
              <Link href="/" className="text-xs font-bold text-white/40 hover:text-[#E8B86A]">
                ← Volver al sitio público
              </Link>
            </div>

            <div className="mt-6 space-y-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#E8B86A]/20 bg-[#E8B86A]/10 text-[#E8B86A]">
                <FaLock className="text-lg" />
              </div>
              <h2 className="text-2xl font-black text-white font-serif">Iniciar Sesión</h2>
              <p className="text-xs text-white/50">Ingresa tus credenciales de administración</p>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/70">Usuario</label>
                <input
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="admin"
                  autoComplete="username"
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#16161A] px-4 py-3 text-xs text-white placeholder:text-white/30 focus:border-[#E8B86A] focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/70">Contraseña</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#16161A] px-4 py-3 text-xs text-white placeholder:text-white/30 focus:border-[#E8B86A] focus:outline-none transition-colors"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-300">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#E8B86A] py-3.5 text-xs font-bold uppercase tracking-wider text-black transition-colors hover:bg-[#D4A574] disabled:opacity-50"
              >
                {loading ? "Ingresando…" : <>Ingresar al Panel <FaArrowRight className="text-xs" /></>}
              </button>
            </form>

            <p className="mt-8 text-center text-[11px] text-white/30">Acceso exclusivo para el equipo de Café Respiro</p>
          </div>
        </div>
      </div>
    </div>
  );
}
