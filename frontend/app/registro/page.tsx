"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function RegistroPage() {
  const router = useRouter();
  const [form, setForm] = useState({ nombre: "", contacto: "", password: "", confirmacion: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault(); setError(null);
    if (form.password !== form.confirmacion) { setError("Las contraseñas no coinciden"); return; }
    if (form.password.length < 8) { setError("La contraseña debe tener al menos 8 caracteres"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/registro", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ nombre: form.nombre, contacto: form.contacto, password: form.password }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(Array.isArray(data.message) ? data.message.join(", ") : data.message || "No se pudo crear la cuenta");
      router.push("/dashboard");
    } catch (e) { setError(e instanceof Error ? e.message : "No se pudo crear la cuenta"); }
    finally { setLoading(false); }
  }

  return <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-[#050507] px-4 py-12 text-white"><section className="surface-card w-full max-w-md p-6 sm:p-8" aria-labelledby="registro-title"><p className="text-xs font-bold tracking-[0.2em] text-[#E8B86A]">CAFÉ RESPIRO</p><h1 id="registro-title" className="mt-3 text-2xl font-bold">Crear cuenta</h1><p className="mt-2 text-sm text-white/60">Guarda tus reservas y consulta tus próximas funciones.</p><form onSubmit={submit} className="mt-6 space-y-4"><div><label htmlFor="registro-nombre" className="text-xs font-medium text-white/70">NOMBRE</label><input id="registro-nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} autoComplete="name" className="control-dark mt-1.5 w-full px-4 py-3 text-sm" required /></div><div><label htmlFor="registro-contacto" className="text-xs font-medium text-white/70">EMAIL O TELÉFONO</label><input id="registro-contacto" value={form.contacto} onChange={(e) => setForm({ ...form, contacto: e.target.value })} autoComplete="email" className="control-dark mt-1.5 w-full px-4 py-3 text-sm" required /></div><div><label htmlFor="registro-password" className="text-xs font-medium text-white/70">CONTRASEÑA</label><input id="registro-password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="new-password" className="control-dark mt-1.5 w-full px-4 py-3 text-sm" required /></div><div><label htmlFor="registro-confirmacion" className="text-xs font-medium text-white/70">REPETIR CONTRASEÑA</label><input id="registro-confirmacion" type="password" value={form.confirmacion} onChange={(e) => setForm({ ...form, confirmacion: e.target.value })} autoComplete="new-password" className="control-dark mt-1.5 w-full px-4 py-3 text-sm" required /></div>{error && <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}<button disabled={loading} className="w-full rounded-lg bg-[#E8B86A] py-3.5 text-sm font-bold text-black disabled:opacity-50">{loading ? "Creando cuenta..." : "Crear cuenta"}</button></form><p className="mt-6 text-center text-sm text-white/60">¿Ya tienes cuenta? <Link href="/login" className="text-[#E8B86A] hover:underline">Inicia sesión</Link></p></section></div>;
}
