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
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Credenciales inválidas");
      router.push("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-[#050507]">
      {/* Left - Branding / Image */}
      <div className="hidden w-[52%] flex-col justify-between overflow-hidden border-r border-white/5 bg-black lg:flex">
        <div className="relative flex-1">
          <img
            src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=900&h=1000&fit=crop"
            alt="Cine"
            className="absolute inset-0 h-full w-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
          <div className="relative flex h-full flex-col p-10">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center">
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                  <path d="M6 10C6 10 6 22 10 25C14 28 22 28 26 25C30 22 30 10 30 10H6Z" stroke="#E8B86A" strokeWidth="1.5" fill="none" />
                  <path d="M30 12C32.5 13 33.5 16 32 18C30.5 20 28 19 26 17" stroke="#E8B86A" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  <path d="M12 6C12 6 13 8 12 10" stroke="#E8B86A" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
                  <path d="M16 4C16 4 17.5 6.5 16 9" stroke="#E8B86A" strokeWidth="1.2" strokeLinecap="round" opacity="0.9" />
                  <path d="M20 6C20 6 21 8 20 10" stroke="#E8B86A" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
                </svg>
              </div>
              <div className="leading-none">
                <div className="text-[11px] tracking-[0.3em] text-white">CAFÉ</div>
                <div className="text-[16px] font-bold tracking-[0.15em] text-white">RESPIRO</div>
                <div className="text-[9px] tracking-[0.25em] text-[#E8B86A]">CINE & CAFÉ</div>
              </div>
            </Link>

            <div className="mt-auto">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-[#E8B86A] animate-pulse" />
                Panel protegido
              </div>
              <h1 className="mt-6 max-w-md text-3xl font-bold leading-tight text-white">
                Bienvenido, <br />
                <span className="text-[#E8B86A]">Admin</span>
              </h1>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-white/60">
                Gestiona la cartelera, las reservas y las votaciones de Café Respiro. Acceso solo con credenciales de entorno.
              </p>
              <div className="mt-6 flex items-center gap-2 text-xs text-white/30">
                <span className="h-px w-8 bg-white/10" />
                “Respira, disfruta y déjate sorprender.”
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-white/5 bg-[#0A0A0A] px-10 py-4">
          <div className="flex items-center justify-between text-xs text-white/30">
            <span>Calle 42 #10-25, Armenia, Colombia</span>
            <span>© 2025 Café Respiro</span>
          </div>
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex flex-1 flex-col bg-[#050507]">
        <div className="flex flex-1 items-center justify-center p-6 sm:p-8">
          <div className="w-full max-w-[380px]">
            <div className="mb-8 lg:hidden">
              <Link href="/" className="inline-flex items-center gap-2 text-xs tracking-[0.2em] text-white/40 hover:text-white">
                ← Volver a la cartelera
              </Link>
            </div>

            <div className="hidden items-center justify-between lg:flex">
              <Link href="/" className="text-xs tracking-wide text-white/40 hover:text-white">
                ← Volver
              </Link>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/50">Fase 1 · MVP</span>
            </div>

            <div className="mt-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#E8B86A]/20 bg-[#E8B86A]/10">
                <FaLock className="text-xl text-[#E8B86A]" />
              </div>
              <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">Iniciar sesión</h2>
              <p className="mt-1 text-sm text-white/50">Ingresa con tu usuario y clave de entorno</p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div>
                <label className="text-xs font-medium tracking-wide text-white/70">USUARIO</label>
                <input
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="admin"
                  autoComplete="username"
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#141414] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[#E8B86A]/50 focus:outline-none focus:ring-1 focus:ring-[#E8B86A]/20"
                />
              </div>
              <div>
                <label className="text-xs font-medium tracking-wide text-white/70">CLAVE</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#141414] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[#E8B86A]/50 focus:outline-none focus:ring-1 focus:ring-[#E8B86A]/20"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#E8B86A] py-3.5 text-sm font-bold tracking-wide text-black transition-colors hover:bg-[#D4A574] disabled:opacity-50"
              >
                {loading ? "Ingresando…" : <>Ingresar al panel <FaArrowRight className="text-xs" /></>}
              </button>

              <div className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
                <p className="text-xs leading-relaxed text-white/30">
                  Sugerencia dev: <span className="font-mono text-white/60">admin</span> /{" "}
                  <span className="font-mono text-white/60">admin123</span> <span className="text-white/20">· ver</span>{" "}
                  <span className="font-mono text-white/40">.env.example</span>
                </p>
              </div>
            </form>

            <p className="mt-6 text-center text-xs text-white/20">Acceso solo para equipo Café Respiro · Sesión 8h · Cookie httpOnly</p>
          </div>
        </div>

        <div className="border-t border-white/5 px-6 py-4 text-center text-xs text-white/20 lg:hidden">
          © 2025 Café Respiro · Cine & Café
        </div>
      </div>
    </div>
  );
}
