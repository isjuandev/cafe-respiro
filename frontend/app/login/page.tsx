"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { FaLock, FaUser, FaArrowRight } from "react-icons/fa";

export default function LoginPage() {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ usuario: usuario.trim(), password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Usuario o contraseña incorrectos");
      }

      // Redirección con sincronización completa de sesión / cookie
      const targetPath = data.role === "admin" ? "/admin" : "/dashboard";
      window.location.href = targetPath;
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo iniciar sesión");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-[#070709] px-4 py-12 text-white">
      <section
        className="surface-card w-full max-w-md p-6 sm:p-8 border border-white/10"
        aria-labelledby="login-title"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#E8B86A]/20 bg-[#E8B86A]/10 text-[#E8B86A]">
          <FaLock className="text-xl" />
        </div>

        <p className="mt-4 text-xs font-bold tracking-[0.2em] text-[#E8B86A]">CAFÉ RESPIRO</p>
        <h1 id="login-title" className="mt-1 text-2xl font-bold">
          Iniciar sesión
        </h1>
        <p className="mt-1 text-sm text-white/60">
          Accede para ver tus reservas y gestionar tu experiencia.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="login-usuario" className="text-xs font-bold tracking-wider text-white/70">
              EMAIL O TELÉFONO
            </label>
            <div className="relative mt-1.5">
              <input
                id="login-usuario"
                type="text"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                autoComplete="username"
                placeholder="ej: valentina.rojas@gmail.com"
                className="control-dark w-full rounded-xl px-4 py-3 text-sm text-white focus:border-[#E8B86A]/50 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="login-password" className="text-xs font-bold tracking-wider text-white/70">
              CONTRASEÑA
            </label>
            <div className="relative mt-1.5">
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
                className="control-dark w-full rounded-xl px-4 py-3 text-sm text-white focus:border-[#E8B86A]/50 focus:outline-none"
                required
              />
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-300"
            >
              {error}
            </div>
          )}

          <button
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#E8B86A] py-3.5 text-sm font-bold text-black transition-colors hover:bg-[#D4A574] disabled:opacity-50"
          >
            {loading ? "Ingresando..." : <>Ingresar a mi cuenta <FaArrowRight className="text-xs" /></>}
          </button>
        </form>

        <div className="mt-6 border-t border-white/5 pt-4 text-center text-xs text-white/50">
          ¿No tienes cuenta aún?{" "}
          <Link href="/registro" className="font-bold text-[#E8B86A] hover:underline">
            Crear cuenta
          </Link>
        </div>
      </section>
    </div>
  );
}
