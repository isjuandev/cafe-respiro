"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { FaUserPlus, FaArrowRight } from "react-icons/fa";

export default function RegistroPage() {
  const [form, setForm] = useState({
    nombre: "",
    contacto: "",
    password: "",
    confirmacion: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirmacion) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (form.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          contacto: form.contacto.trim(),
          password: form.password,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          Array.isArray(data.message)
            ? data.message.join(", ")
            : data.message || "No se pudo crear la cuenta"
        );
      }

      window.location.href = "/dashboard";
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear la cuenta");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-[#050507] px-4 py-12 text-white">
      <section
        className="surface-card w-full max-w-md p-6 sm:p-8 border border-white/10"
        aria-labelledby="registro-title"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#E8B86A]/20 bg-[#E8B86A]/10 text-[#E8B86A]">
          <FaUserPlus className="text-xl" />
        </div>

        <p className="mt-4 text-xs font-bold tracking-[0.2em] text-[#E8B86A]">CAFÉ RESPIRO</p>
        <h1 id="registro-title" className="mt-1 text-2xl font-bold">
          Crear cuenta
        </h1>
        <p className="mt-1 text-sm text-white/60">
          Guarda tus reservas y consulta tus próximas funciones de cine.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="registro-nombre" className="text-xs font-bold tracking-wider text-white/70">
              NOMBRE COMPLETO
            </label>
            <input
              id="registro-nombre"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              autoComplete="name"
              placeholder="ej: Valentina Rojas"
              className="control-dark mt-1.5 w-full rounded-xl px-4 py-3 text-sm focus:border-[#E8B86A]/50 focus:outline-none"
              required
            />
          </div>

          <div>
            <label htmlFor="registro-contacto" className="text-xs font-bold tracking-wider text-white/70">
              EMAIL O TELÉFONO
            </label>
            <input
              id="registro-contacto"
              value={form.contacto}
              onChange={(e) => setForm({ ...form, contacto: e.target.value })}
              autoComplete="email"
              placeholder="ej: valentina.rojas@gmail.com"
              className="control-dark mt-1.5 w-full rounded-xl px-4 py-3 text-sm focus:border-[#E8B86A]/50 focus:outline-none"
              required
            />
          </div>

          <div>
            <label htmlFor="registro-password" className="text-xs font-bold tracking-wider text-white/70">
              CONTRASEÑA (MÍNIMO 8 CARACTERES)
            </label>
            <input
              id="registro-password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              autoComplete="new-password"
              placeholder="••••••••"
              className="control-dark mt-1.5 w-full rounded-xl px-4 py-3 text-sm focus:border-[#E8B86A]/50 focus:outline-none"
              required
            />
          </div>

          <div>
            <label htmlFor="registro-confirmacion" className="text-xs font-bold tracking-wider text-white/70">
              CONFIRMAR CONTRASEÑA
            </label>
            <input
              id="registro-confirmacion"
              type="password"
              value={form.confirmacion}
              onChange={(e) => setForm({ ...form, confirmacion: e.target.value })}
              autoComplete="new-password"
              placeholder="••••••••"
              className="control-dark mt-1.5 w-full rounded-xl px-4 py-3 text-sm focus:border-[#E8B86A]/50 focus:outline-none"
              required
            />
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
            {loading ? "Creando cuenta..." : <>Registrarme <FaArrowRight className="text-xs" /></>}
          </button>
        </form>

        <div className="mt-6 border-t border-white/5 pt-4 text-center text-xs text-white/50">
          ¿Ya tienes una cuenta?{" "}
          <Link href="/login" className="font-bold text-[#E8B86A] hover:underline">
            Iniciar sesión
          </Link>
        </div>
      </section>
    </div>
  );
}
