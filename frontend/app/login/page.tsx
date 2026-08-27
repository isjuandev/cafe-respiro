"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault(); setError(null); setLoading(true);
    try {
      const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ usuario, password }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Usuario o contraseña incorrectos");
      router.push(data.role === "admin" ? "/admin" : "/dashboard");
    } catch (e) { setError(e instanceof Error ? e.message : "No se pudo iniciar sesión"); }
    finally { setLoading(false); }
  }

  return <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-[#050507] px-4 py-12 text-white"><section className="surface-card w-full max-w-md p-6 sm:p-8" aria-labelledby="login-title"><p className="text-xs font-bold tracking-[0.2em] text-[#E8B86A]">CAFÉ RESPIRO</p><h1 id="login-title" className="mt-3 text-2xl font-bold">Iniciar sesión</h1><p className="mt-2 text-sm text-white/60">Accede a tus reservas o al panel de administración.</p><form onSubmit={submit} className="mt-6 space-y-4"><div><label htmlFor="login-usuario" className="text-xs font-medium text-white/70">EMAIL O TELÉFONO</label><input id="login-usuario" value={usuario} onChange={(e) => setUsuario(e.target.value)} autoComplete="username" className="control-dark mt-1.5 w-full px-4 py-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#E8B86A]" required /></div><div><label htmlFor="login-password" className="text-xs font-medium text-white/70">CONTRASEÑA</label><input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" className="control-dark mt-1.5 w-full px-4 py-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#E8B86A]" required /></div>{error && <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}<button disabled={loading} className="w-full rounded-lg bg-[#E8B86A] py-3.5 text-sm font-bold text-black disabled:opacity-50">{loading ? "Ingresando..." : "Iniciar sesión"}</button></form><p className="mt-6 text-center text-sm text-white/60">¿No tienes cuenta? <Link href="/registro" className="text-[#E8B86A] hover:underline">Regístrate</Link></p></section></div>;
}
