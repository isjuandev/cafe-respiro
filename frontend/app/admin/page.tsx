"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaFilm, FaCalendarAlt, FaTicketAlt, FaChartBar, FaLightbulb, FaUsers, FaClock, FaCog, FaLock, FaHome, FaSignOutAlt, FaStar, FaArrowUp } from "react-icons/fa";

type Sugerencia = {
  id: string;
  titulo: string;
  comentario?: string | null;
  nombreSolicitante: string;
  estado: string;
  createdAt: string;
  _count: { votos: number };
};

type Funcion = {
  id: string;
  peliculaId: string;
  pelicula: { id: string; titulo: string; director?: string | null; anio?: number | null; duracionMin?: number | null; sinopsis?: string | null };
  fechaHora: string;
  cupoTotal: number;
  cuposOcupados?: number;
  cuposDisponibles?: number;
};

type Reserva = {
  id: string;
  funcionId: string;
  nombre: string;
  contacto: string;
  cantidad: number;
  createdAt: string;
};

function getPoster(titulo: string) {
  const t = titulo.toLowerCase();
  if (t.includes("interstellar")) return "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400&h=500&fit=crop";
  if (t.includes("chihiro")) return "https://images.unsplash.com/photo-1518709594023-6eab9bab7b23?w=400&h=500&fit=crop";
  if (t.includes("whiplash")) return "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=500&fit=crop";
  if (t.includes("shrek")) return "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&h=500&fit=crop";
  return "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=500&fit=crop";
}

export default function AdminPage() {
  const router = useRouter();
  const [auth, setAuth] = useState<boolean | null>(null);
  const [sugerencias, setSugerencias] = useState<Sugerencia[] | null>(null);
  const [funciones, setFunciones] = useState<Funcion[] | null>(null);
  const [reservasRecientes, setReservasRecientes] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFuncion, setSelectedFuncion] = useState<string>("");

  const [createForm, setCreateForm] = useState({ sugerenciaId: "", fechaHora: "", cupoTotal: 30 });
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  // Biblioteca
  type Pelicula = { id: string; titulo: string; director?: string | null; anio?: number | null; tituloNormalizado?: string | null; _count?: { funciones: number } };
  const [peliculas, setPeliculas] = useState<Pelicula[] | null>(null);
  const [peliculaForm, setPeliculaForm] = useState({ titulo: "", director: "", anio: "", duracionMin: "", sinopsis: "" });
  const [peliculaError, setPeliculaError] = useState<string | null>(null);
  const [peliculaSuccess, setPeliculaSuccess] = useState<string | null>(null);
  const [showPeliculaForm, setShowPeliculaForm] = useState(false);
  const [programarPeliculaId, setProgramarPeliculaId] = useState("");
  const [programarError, setProgramarError] = useState<string | null>(null);
  const [programarSuccess, setProgramarSuccess] = useState<string | null>(null);

  async function checkAuth() {
    const res = await fetch("/api/admin/me", { credentials: "include" });
    if (!res.ok) {
      router.push("/admin/login");
      return false;
    }
    return true;
  }

  async function loadPeliculas() {
    try {
      const res = await fetch("/api/admin/peliculas", { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setPeliculas(data.peliculas);
    } catch {}
  }

  async function loadAll() {
    try {
      const [sRes, fRes, pRes] = await Promise.all([
        fetch("/api/admin/sugerencias", { credentials: "include" }),
        fetch("/api/funciones", { credentials: "include" }),
        fetch("/api/admin/peliculas", { credentials: "include" }),
      ]);
      if (!sRes.ok) throw new Error(await sRes.text());
      if (!fRes.ok) throw new Error(await fRes.text());
      const sData = await sRes.json();
      const fData = await fRes.json();
      const pData = pRes.ok ? await pRes.json() : { peliculas: [] };
      setSugerencias(sData.sugerencias);
      setFunciones(fData.funciones);
      setPeliculas(pData.peliculas);
      // Cargar reservas de la primera función para dashboard
      if (fData.funciones.length > 0) {
        const fid = fData.funciones[0].id;
        setSelectedFuncion(fid);
        const rRes = await fetch(`/api/admin/funciones/${fid}/reservas`, { credentials: "include" });
        if (rRes.ok) {
          const rData = await rRes.json();
          setReservasRecientes(rData.reservas.slice(0, 5));
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    }
  }

  async function init() {
    try {
      const ok = await checkAuth();
      if (!ok) return;
      setAuth(true);
      await loadAll();
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
      await loadAll();
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
      if (!res.ok) throw new Error(data.message || "Error");
      setCreateSuccess(`Función creada: ${data.funcion.pelicula.titulo}`);
      setShowCreate(false);
      await loadAll();
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
      setReservasRecientes(data.reservas.slice(0, 5));
    } catch (e) {
      setReservasRecientes([]);
    }
  }

  async function crearPelicula(e: React.FormEvent) {
    e.preventDefault();
    setPeliculaError(null);
    setPeliculaSuccess(null);
    try {
      const res = await fetch("/api/admin/peliculas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          titulo: peliculaForm.titulo.trim(),
          director: peliculaForm.director.trim() || undefined,
          anio: peliculaForm.anio ? Number(peliculaForm.anio) : undefined,
          duracionMin: peliculaForm.duracionMin ? Number(peliculaForm.duracionMin) : undefined,
          sinopsis: peliculaForm.sinopsis.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error");
      if (data.duplicada) {
        setPeliculaError(data.aviso || "Película muy similar ya existe en biblioteca");
        return;
      }
      setPeliculaSuccess(`Película "${data.pelicula.titulo}" creada`);
      setPeliculaForm({ titulo: "", director: "", anio: "", duracionMin: "", sinopsis: "" });
      await loadPeliculas();
    } catch (err) {
      setPeliculaError(err instanceof Error ? err.message : "Error");
    }
  }

  async function crearPeliculaDesdeSugerencia(sugerenciaId: string) {
    try {
      const res = await fetch(`/api/admin/sugerencias/${sugerenciaId}/pelicula`, { method: "POST", credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error");
      await loadAll();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error");
    }
  }

  async function programarDesdePelicula(e: React.FormEvent) {
    e.preventDefault();
    setProgramarError(null);
    setProgramarSuccess(null);
    try {
      const peliculaId = programarPeliculaId;
      const fechaHora = (document.getElementById("prog-fecha") as HTMLInputElement)?.value;
      const cupo = Number((document.getElementById("prog-cupo") as HTMLInputElement)?.value);
      if (!peliculaId || !fechaHora) throw new Error("Elige película y fecha");
      const res = await fetch(`/api/admin/peliculas/${peliculaId}/funciones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ fechaHora: new Date(fechaHora).toISOString(), cupoTotal: cupo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error");
      setProgramarSuccess(`Función programada: ${data.funcion.pelicula.titulo}`);
      await loadAll();
    } catch (err) {
      setProgramarError(err instanceof Error ? err.message : "Error");
    }
  }

  const [cerrando, setCerrando] = useState(false);
  async function cerrarVotacion() {
    if (!confirm("¿Cerrar la votación activa? Todas las PENDIENTE pasarán a DESCARTADA.")) return;
    try {
      setCerrando(true);
      const res = await fetch("/api/admin/votaciones/cerrar", { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      alert(`Votación cerrada: ${data.cerradas} sugerencias cerradas`);
      await loadAll();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al cerrar");
    } finally {
      setCerrando(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    router.push("/admin/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050507] p-8">
        <div className="mx-auto max-w-[1400px] animate-pulse">
          <div className="h-32 rounded-2xl bg-white/5" />
          <div className="mt-6 h-64 rounded-2xl bg-white/5" />
        </div>
      </div>
    );
  }
  if (auth === false) return null;
  if (error) return <div className="min-h-screen bg-[#050507] p-8"><p className="text-red-400">{error}</p></div>;

  const totalVotos = (sugerencias || []).reduce((s, x) => s + (x._count?.votos || 0), 0);
  const totalReservas = reservasRecientes.length;
  const sugerenciasPendientes = (sugerencias || []).filter((s) => s.estado === "PENDIENTE").length;
  const funcionHoy = funciones && funciones.length > 0 ? funciones[0] : null;
  const votacionActiva = [...(sugerencias || [])].sort((a, b) => (b._count.votos || 0) - (a._count.votos || 0)).slice(0, 4);
  const maxVotos = Math.max(...(sugerencias || []).map((s) => s._count.votos || 0), 1);
  const ocupados = funcionHoy ? funcionHoy.cuposOcupados ?? 0 : 5;
  const disponibles = funcionHoy ? funcionHoy.cuposDisponibles ?? 3 : 3;
  const totalCupos = funcionHoy ? funcionHoy.cupoTotal : 8;
  const pctOcupados = totalCupos ? Math.round((ocupados / totalCupos) * 100) : 0;

  return (
    <div className="flex min-h-screen bg-[#050507] text-white">
      {/* SIDEBAR */}
      <aside className="hidden w-[220px] flex-col border-r border-white/5 bg-[#0A0A0A] lg:flex">
        <div className="flex h-[64px] items-center gap-3 border-b border-white/5 px-5">
          <div className="flex h-8 w-8 items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 36 36" fill="none">
              <path d="M6 10C6 10 6 22 10 25C14 28 22 28 26 25C30 22 30 10 30 10H6Z" stroke="#E8B86A" strokeWidth="1.5" fill="none" />
              <path d="M30 12C32.5 13 33.5 16 32 18C30.5 20 28 19 26 17" stroke="#E8B86A" strokeWidth="1.5" fill="none" />
            </svg>
          </div>
          <div className="leading-none">
            <div className="text-[10px] tracking-[0.2em] text-white">CAFÉ</div>
            <div className="text-sm font-bold tracking-[0.12em] text-white">RESPIRO</div>
            <div className="text-[8px] tracking-[0.2em] text-[#E8B86A]">CINE & CAFÉ</div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          <Link href="/admin" className="flex items-center gap-3 rounded-lg bg-[#E8B86A]/20 px-3 py-2.5 text-sm font-medium text-[#E8B86A]">
            <FaHome className="text-sm" /> Dashboard
          </Link>
          <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/40">
            <FaFilm className="text-white/40" /> Películas <span className="ml-auto text-xs opacity-0">›</span>
          </div>
          <Link href="/admin" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/70 hover:bg-white/5 hover:text-white">
            <FaCalendarAlt className="text-white/70" /> Funciones
          </Link>
          <Link href="/admin" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/70 hover:bg-white/5 hover:text-white">
            <FaTicketAlt className="text-white/70" /> Reservas
          </Link>
          <Link href="/sugerencias" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/70 hover:bg-white/5 hover:text-white">
            <FaChartBar className="text-white/70" /> Votaciones
          </Link>
          <Link href="/admin" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/70 hover:bg-white/5 hover:text-white">
            <FaLightbulb className="text-white/70" /> Sugerencias
          </Link>
          <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/20">
            <FaUsers className="text-white/20" /> Clientes
          </div>
          <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/20">
            <FaClock className="text-white/20" /> Reportes
          </div>
          <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/20">
            <FaCog className="text-white/20" /> Configuración
          </div>
        </nav>

        <div className="border-t border-white/5 p-3">
          <div className="flex items-center gap-3 rounded-lg bg-white/[0.03] px-3 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E8B86A]/20 text-sm font-bold text-[#E8B86A]">A</div>
            <div className="flex-1">
              <div className="text-sm font-medium text-white">Admin</div>
              <div className="text-xs text-white/40">Administrador</div>
            </div>
            <span className="text-white/20">›</span>
          </div>
          <button onClick={logout} className="mt-3 flex w-full items-center gap-2 px-3 py-2 text-xs text-white/40 hover:text-white">
            <FaSignOutAlt /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1">
        <header className="flex h-[64px] items-center justify-between border-b border-white/5 bg-[#050507] px-6">
          <div>
            <h1 className="text-xl font-bold text-white">Dashboard</h1>
            <p className="text-xs text-[#E8B86A]">Bienvenido, Admin</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 text-xs text-white/60 sm:flex">
              <FaCalendarAlt /> Martes, 27 de mayo de 2025
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70">
              <FaCalendarAlt /> Hoy
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6">
          {/* TOP STATS */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-xl border border-white/10 bg-[#141414] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E8B86A]/15 text-[#E8B86A]">
                  <FaTicketAlt />
                </div>
                <span className="text-xs text-white/60">Reservas para hoy</span>
              </div>
              <div className="mt-3 text-2xl font-bold text-white">
                {ocupados} <span className="text-white/40">/ {totalCupos}</span>
              </div>
              <div className="mt-1 flex items-center gap-1 text-xs text-white/40">
                cupos ocupados <span className="ml-auto text-[#6B8E6B]"><FaArrowUp className="text-xs" /></span>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#141414] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E8B86A]/15 text-[#E8B86A]">
                  <FaUsers />
                </div>
                <span className="text-xs text-white/60">Disponibles</span>
              </div>
              <div className="mt-3 text-2xl font-bold text-white">{disponibles}</div>
              <div className="mt-1 flex items-center gap-1 text-xs text-white/40">
                cupos libres <span className="ml-auto text-[#6B8E6B]"><FaArrowUp className="text-xs" /></span>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#141414] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E8B86A]/15 text-[#E8B86A]">
                  <FaFilm />
                </div>
                <span className="text-xs text-white/60">Función de hoy</span>
              </div>
              <div className="mt-3 text-xl font-bold text-white">{funcionHoy ? new Date(funcionHoy.fechaHora).toLocaleTimeString("es-UY", { hour: "2-digit", minute: "2-digit" }) : "7:00 PM"}</div>
              <div className="mt-1 text-xs text-white/40">Hora programada</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#141414] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E8B86A]/15 text-[#E8B86A]">
                  <FaStar />
                </div>
                <span className="text-xs text-white/60">Votos totales</span>
              </div>
              <div className="mt-3 text-2xl font-bold text-white">{totalVotos}</div>
              <div className="mt-1 flex items-center gap-1 text-xs text-white/40">
                esta semana <span className="ml-auto text-[#6B8E6B]"><FaArrowUp className="text-xs" /></span>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#141414] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E8B86A]/15 text-[#E8B86A]">
                  <FaLightbulb />
                </div>
                <span className="text-xs text-white/60">Sugerencias</span>
              </div>
              <div className="mt-3 text-2xl font-bold text-white">{sugerenciasPendientes}</div>
              <div className="mt-1 flex items-center gap-1 text-xs text-white/40">
                pendientes <span className="ml-auto text-[#E8B86A]"><FaArrowUp className="text-xs" /></span>
              </div>
            </div>
          </div>

          {/* BIBLIOTECA */}
          <div className="mt-4 rounded-xl border border-white/10 bg-[#141414] p-5">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xs font-bold tracking-[0.15em] text-white">
                <FaFilm className="text-[#E8B86A]" /> BIBLIOTECA
              </h2>
              <button onClick={() => setShowPeliculaForm(!showPeliculaForm)} className="rounded-lg bg-[#E8B86A] px-3 py-1.5 text-xs font-bold text-black hover:bg-[#D4A574]">
                + Nueva película
              </button>
            </div>
            <p className="mt-1 text-xs text-white/40">Catálogo para programar funciones. Sin unique duro: si el título es muy similar, avisa.</p>
            {showPeliculaForm && (
              <form onSubmit={crearPelicula} className="mt-4 grid gap-3 rounded-xl border border-white/10 bg-[#0A0A0A] p-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="text-xs text-white/60">Título *</label>
                  <input value={peliculaForm.titulo} onChange={(e) => setPeliculaForm({ ...peliculaForm, titulo: e.target.value })} placeholder="Ej: Dune" className="mt-1 w-full rounded-lg border border-white/10 bg-[#141414] px-3 py-2 text-sm text-white" required />
                </div>
                <div>
                  <label className="text-xs text-white/60">Director</label>
                  <input value={peliculaForm.director} onChange={(e) => setPeliculaForm({ ...peliculaForm, director: e.target.value })} placeholder="Villeneuve" className="mt-1 w-full rounded-lg border border-white/10 bg-[#141414] px-3 py-2 text-sm text-white" />
                </div>
                <div>
                  <label className="text-xs text-white/60">Año</label>
                  <input type="number" value={peliculaForm.anio} onChange={(e) => setPeliculaForm({ ...peliculaForm, anio: e.target.value })} placeholder="2021" className="mt-1 w-full rounded-lg border border-white/10 bg-[#141414] px-3 py-2 text-sm text-white" />
                </div>
                <div>
                  <label className="text-xs text-white/60">Duración (min)</label>
                  <input type="number" value={peliculaForm.duracionMin} onChange={(e) => setPeliculaForm({ ...peliculaForm, duracionMin: e.target.value })} placeholder="155" className="mt-1 w-full rounded-lg border border-white/10 bg-[#141414] px-3 py-2 text-sm text-white" />
                </div>
                <div>
                  <label className="text-xs text-white/60">Poster URL</label>
                  <input value={peliculaForm.sinopsis} onChange={(e) => setPeliculaForm({ ...peliculaForm, sinopsis: e.target.value })} placeholder="Sinopsis corta" className="mt-1 w-full rounded-lg border border-white/10 bg-[#141414] px-3 py-2 text-sm text-white" />
                </div>
                <div className="sm:col-span-2">
                  {peliculaError && <p className="text-xs text-amber-300">{peliculaError}</p>}
                  {peliculaSuccess && <p className="text-xs text-green-400">{peliculaSuccess}</p>}
                  <button type="submit" className="w-full rounded-lg bg-[#E8B86A] py-2 text-sm font-bold text-black">Guardar en biblioteca</button>
                  <p className="mt-1 text-[10px] text-white/20">getGenre() sigue siendo heurística director→género (deuda documentada).</p>
                </div>
              </form>
            )}
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {(peliculas || []).slice(0, 6).map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2">
                  <div className="truncate">
                    <div className="text-xs font-medium text-white truncate max-w-[150px]">{p.titulo}</div>
                    <div className="text-[10px] text-white/40">
                      {p.director || "—"} {p.anio ? `· ${p.anio}` : ""}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setProgramarPeliculaId(p.id);
                      document.getElementById("prog-pelicula")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="rounded bg-white/10 px-2 py-1 text-xs text-white/70 hover:bg-[#E8B86A] hover:text-black"
                  >
                    Programar
                  </button>
                </div>
              ))}
              {(!peliculas || peliculas.length === 0) && <p className="text-xs text-white/30">Biblioteca vacía. Crea la primera película.</p>}
            </div>

            <form onSubmit={programarDesdePelicula} className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <div className="flex-1 min-w-[160px]">
                <label className="text-xs text-white/60">Película</label>
                <select id="prog-pelicula" value={programarPeliculaId} onChange={(e) => setProgramarPeliculaId(e.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-[#141414] px-3 py-2 text-sm text-white" required>
                  <option value="">— Elige de biblioteca —</option>
                  {(peliculas || []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.titulo}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-white/60">Fecha y hora</label>
                <input id="prog-fecha" type="datetime-local" required className="mt-1 rounded-lg border border-white/10 bg-[#141414] px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="text-xs text-white/60">Cupo</label>
                <input id="prog-cupo" type="number" defaultValue={30} min={1} max={200} className="mt-1 w-20 rounded-lg border border-white/10 bg-[#141414] px-3 py-2 text-sm text-white" />
              </div>
              <button type="submit" className="rounded-lg bg-[#E8B86A] px-4 py-2 text-sm font-bold text-black">
                Programar
              </button>
            </form>
            {programarError && <p className="mt-2 text-xs text-red-300">{programarError}</p>}
            {programarSuccess && <p className="mt-2 text-xs text-green-300">{programarSuccess}</p>}
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {/* FUNCIÓN DE HOY */}
            <div className="rounded-xl border border-white/10 bg-[#141414] p-5 lg:col-span-2">
              <h2 className="text-xs font-bold tracking-[0.15em] text-white">FUNCIÓN DE HOY</h2>
              {funcionHoy ? (
                <div className="mt-4 flex gap-5">
                  <div className="h-[180px] w-[120px] flex-shrink-0 overflow-hidden rounded-xl bg-black">
                    <img src={getPoster(funcionHoy.pelicula.titulo)} alt={funcionHoy.pelicula.titulo} className="h-full w-full object-cover" />
                    <div className="-mt-6 bg-gradient-to-t from-black p-1 text-center text-[9px] font-bold tracking-widest text-white">{funcionHoy.pelicula.titulo.toUpperCase().slice(0, 20)}</div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white">{funcionHoy.pelicula.titulo}</h3>
                    <p className="text-xs text-white/50">
                      {funcionHoy.pelicula.director || "Cine"} · {funcionHoy.pelicula.anio || "2024"} · {funcionHoy.pelicula.duracionMin ? `${Math.floor(funcionHoy.pelicula.duracionMin / 60)}h ${funcionHoy.pelicula.duracionMin % 60}min` : "2h 49min"}
                    </p>
                    <div className="mt-3 inline-flex rounded bg-[#E8B86A]/15 px-2 py-1 text-[10px] font-bold tracking-wide text-[#E8B86A]">CONFIRMADA</div>
                    <div className="mt-3 space-y-2 text-xs">
                      <div className="flex items-center gap-2 text-white/70">
                        <FaClock className="text-[#E8B86A]" /> {new Date(funcionHoy.fechaHora).toLocaleTimeString("es-UY", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <div className="flex items-center gap-2 text-white/70">
                        <FaTicketAlt /> Capacidad: {totalCupos} cupos
                      </div>
                      <div className="flex items-center gap-2 text-white/70">
                        <FaUsers /> Reservados: {ocupados}
                      </div>
                      <div className="flex items-center gap-2 text-white/70">
                        <FaUsers /> Disponibles: {disponibles}
                      </div>
                    </div>
                    <button onClick={() => setShowCreate(!showCreate)} className="mt-4 flex items-center gap-2 rounded-lg border border-[#E8B86A]/30 bg-[#E8B86A]/10 px-3 py-2 text-xs font-medium text-[#E8B86A] hover:bg-[#E8B86A]/20">
                      <FaCalendarAlt /> {showCreate ? "Cerrar" : "Programar función"}
                    </button>
                  </div>
                  <div className="hidden flex-col items-center sm:flex">
                    <div className="relative h-28 w-28">
                      <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                        <circle cx="50" cy="50" r="42" fill="none" stroke="#E8B86A" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${pctOcupados * 2.64} 264`} />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-lg font-bold text-white">
                          {ocupados} <span className="text-white/40">/ {totalCupos}</span>
                        </span>
                        <span className="text-[10px] text-white/50">cupos</span>
                        <span className="text-[10px] text-white/50">ocupados</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-white/50">No hay función programada para hoy.</p>
              )}
              {showCreate && (
                <form onSubmit={crearFuncion} className="mt-6 space-y-4 rounded-xl border border-[#E8B86A]/20 bg-[#0A0A0A] p-5">
                  <div>
                    <h3 className="text-sm font-bold text-white">Programar función</h3>
                    <p className="mt-1 text-xs leading-relaxed text-white/50">
                      Elige una idea aprobada y asígnale fecha y cupo. Se creará la película y la función que verán los clientes en Cartelera.
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium tracking-wide text-white/70">Sugerencia aprobada *</label>
                    <select
                      value={createForm.sugerenciaId}
                      onChange={(e) => setCreateForm({ ...createForm, sugerenciaId: e.target.value })}
                      className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#141414] px-3 py-2.5 text-sm text-white focus:border-[#E8B86A]/50 focus:outline-none"
                      required
                    >
                      <option value="" className="bg-[#141414]">
                        — Elige una sugerencia en PROGRAMADA —
                      </option>
                      {(sugerencias || [])
                        .filter((s) => s.estado === "PROGRAMADA")
                        .map((s) => (
                          <option key={s.id} value={s.id} className="bg-[#141414]">
                            {s.titulo} — {s._count.votos} votos · por {s.nombreSolicitante}
                          </option>
                        ))}
                    </select>
                    {(sugerencias || []).filter((s) => s.estado === "PROGRAMADA").length === 0 && (
                      <p className="mt-2 text-xs text-amber-300/80">No hay sugerencias programadas. Cambia alguna de PENDIENTE a PROGRAMADA arriba.</p>
                    )}
                  </div>

                  {createForm.sugerenciaId && (
                    <div className="flex items-center gap-3 rounded-xl border border-[#E8B86A]/20 bg-[#E8B86A]/5 p-3">
                      <img src={getPoster((sugerencias || []).find((s) => s.id === createForm.sugerenciaId)?.titulo || "")} alt="" className="h-12 w-9 rounded object-cover" />
                      <div className="flex-1">
                        <div className="text-xs font-medium text-white">{(sugerencias || []).find((s) => s.id === createForm.sugerenciaId)?.titulo}</div>
                        <div className="text-xs text-white/50">→ Se creará como Película + Función</div>
                      </div>
                      <FaArrowUp className="text-[#E8B86A] rotate-45" />
                      <div className="text-center">
                        <div className="text-xs font-bold text-white">Función</div>
                        <div className="text-[10px] text-white/40">en cartelera</div>
                      </div>
                    </div>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-medium tracking-wide text-white/70">Fecha y hora de la función *</label>
                      <input
                        type="datetime-local"
                        required
                        value={createForm.fechaHora}
                        onChange={(e) => setCreateForm({ ...createForm, fechaHora: e.target.value })}
                        className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#141414] px-3 py-2.5 text-sm text-white focus:border-[#E8B86A]/50 focus:outline-none"
                      />
                      <p className="mt-1 text-[10px] text-white/30">Debe ser futura</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium tracking-wide text-white/70">Cupo total *</label>
                      <input
                        type="number"
                        min={1}
                        max={200}
                        required
                        value={createForm.cupoTotal}
                        onChange={(e) => setCreateForm({ ...createForm, cupoTotal: Number(e.target.value) })}
                        className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#141414] px-3 py-2.5 text-sm text-white focus:border-[#E8B86A]/50 focus:outline-none"
                        placeholder="30"
                      />
                      <p className="mt-1 text-[10px] text-white/30">1 a 200 personas</p>
                    </div>
                  </div>
                  {createError && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">{createError}</p>}
                  {createSuccess && <p className="rounded-lg bg-green-500/10 px-3 py-2 text-xs text-green-300">{createSuccess} · Ver en cartelera</p>}
                  <button type="submit" className="w-full rounded-xl bg-[#E8B86A] py-3 text-sm font-bold tracking-wide text-black hover:bg-[#D4A574]">
                    Programar función
                  </button>
                </form>
              )}
            </div>

            {/* VOTACIÓN ACTIVA */}
            <div className="rounded-xl border border-white/10 bg-[#141414] p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold tracking-[0.15em] text-white">VOTACIÓN ACTIVA</h2>
                <Link href="/sugerencias" className="rounded border border-white/10 px-2 py-1 text-xs text-white/60 hover:text-white">
                  Ver todas
                </Link>
              </div>
              <div className="mt-4 space-y-3">
                {votacionActiva.map((s) => {
                  const pct = maxVotos ? Math.round(((s._count.votos || 0) / maxVotos) * 100) : 0;
                  return (
                    <div key={s.id} className="flex items-center gap-3">
                      <img src={getPoster(s.titulo)} alt={s.titulo} className="h-12 w-10 rounded object-cover" />
                      <div className="flex-1">
                        <div className="text-xs font-medium text-white truncate">{s.titulo}</div>
                        <div className="mt-1 h-1.5 w-full rounded-full bg-white/10">
                          <div className="h-full rounded-full bg-[#E8B86A]" style={{ width: `${Math.max(8, pct)}%` }} />
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-[#E8B86A]">{s._count.votos || 0}</div>
                        <div className="text-[10px] text-white/40">votos</div>
                      </div>
                    </div>
                  );
                })}
                {votacionActiva.length === 0 && <p className="text-xs text-white/40">Sin votos aún</p>}
              </div>
              <button
                onClick={cerrarVotacion}
                disabled={cerrando}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 py-2 text-xs font-medium text-red-300 hover:bg-red-500/20 disabled:opacity-50"
              >
                <FaLock className="text-xs" /> {cerrando ? "Cerrando..." : "Cerrar votación"}
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {/* RESERVAS RECIENTES */}
            <div className="rounded-xl border border-white/10 bg-[#141414] p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold tracking-[0.15em] text-white">RESERVAS RECIENTES</h2>
                <button onClick={() => funciones && funciones[0] && verReservas(funciones[0].id)} className="rounded border border-white/10 px-2 py-1 text-xs text-white/60">
                  Ver todas
                </button>
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-white/40">
                      <th className="pb-2 text-left font-normal">Código</th>
                      <th className="pb-2 text-left font-normal">Cliente</th>
                      <th className="pb-2 text-left font-normal">Personas</th>
                      <th className="pb-2 text-left font-normal">Estado</th>
                      <th className="pb-2 text-left font-normal">Hora</th>
                    </tr>
                  </thead>
                  <tbody className="space-y-1">
                    {reservasRecientes.map((r, idx) => (
                      <tr key={r.id} className="border-t border-white/5">
                        <td className="py-2 font-mono text-white/80">{r.id.slice(0, 4).toUpperCase()}</td>
                        <td className="py-2 text-white/80">{r.nombre}</td>
                        <td className="py-2 text-white/60">{r.cantidad}</td>
                        <td className="py-2">
                          <span className="rounded-full bg-[#6B8E6B]/20 px-2 py-0.5 text-[10px] text-[#6B8E6B]">Confirmada</span>
                        </td>
                        <td className="py-2 text-white/40">{new Date(r.createdAt).toLocaleTimeString("es-UY", { hour: "2-digit", minute: "2-digit" })}</td>
                      </tr>
                    ))}
                    {reservasRecientes.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-white/40">
                          Sin reservas recientes — selecciona una función arriba
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {funciones && funciones.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {funciones.slice(0, 3).map((f) => (
                    <button key={f.id} onClick={() => verReservas(f.id)} className={`rounded px-2 py-1 text-xs ${selectedFuncion === f.id ? "bg-[#E8B86A] text-black" : "bg-white/5 text-white/60"}`}>
                      {f.pelicula.titulo.slice(0, 12)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* SUGERENCIAS RECIENTES */}
            <div className="rounded-xl border border-white/10 bg-[#141414] p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold tracking-[0.15em] text-white">SUGERENCIAS RECIENTES</h2>
                <Link href="/sugerencias" className="rounded border border-white/10 px-2 py-1 text-xs text-white/60">
                  Ver todas
                </Link>
              </div>
              <div className="mt-4 space-y-3">
                {(sugerencias || []).slice(0, 5).map((s) => (
                  <div key={s.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FaLightbulb className="text-[#E8B86A]" />
                      <span className="text-xs text-white/80 truncate max-w-[160px]">{s.titulo}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/40">{new Date(s.createdAt).toLocaleDateString("es-UY", { hour: "2-digit", minute: "2-digit" })}</span>
                      <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${s.estado === "PENDIENTE" ? "bg-[#E8B86A] text-black" : s.estado === "PROGRAMADA" ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white/60"}`}>
                        {s.estado === "PENDIENTE" ? "Nueva" : s.estado}
                      </span>
                    </div>
                  </div>
                ))}
                {(!sugerencias || sugerencias.length === 0) && <p className="text-xs text-white/40">Sin sugerencias</p>}
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-[#141414] p-5 lg:col-span-2">
              <h2 className="text-xs font-bold tracking-[0.15em] text-white">ACTIVIDAD DEL DÍA</h2>
              <div className="mt-4 grid grid-cols-4 gap-3">
                <div className="rounded-xl bg-white/[0.03] p-3 text-center">
                  <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-[#E8B86A]/15 text-[#E8B86A]">
                    <FaTicketAlt />
                  </div>
                  <div className="mt-2 text-lg font-bold text-white">{reservasRecientes.length}</div>
                  <div className="text-xs text-white/40">Reservas</div>
                  <div className="text-[10px] text-[#6B8E6B]">+2 vs ayer</div>
                </div>
                <div className="rounded-xl bg-white/[0.03] p-3 text-center">
                  <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/15 text-purple-400">
                    <FaChartBar />
                  </div>
                  <div className="mt-2 text-lg font-bold text-white">{totalVotos}</div>
                  <div className="text-xs text-white/40">Votos</div>
                  <div className="text-[10px] text-[#6B8E6B]">+23 vs ayer</div>
                </div>
                <div className="rounded-xl bg-white/[0.03] p-3 text-center">
                  <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-[#E8B86A]/15 text-[#E8B86A]">
                    <FaLightbulb />
                  </div>
                  <div className="mt-2 text-lg font-bold text-white">{sugerencias?.length || 0}</div>
                  <div className="text-xs text-white/40">Sugerencias</div>
                  <div className="text-[10px] text-[#6B8E6B]">+4 vs ayer</div>
                </div>
                <div className="rounded-xl bg-white/[0.03] p-3 text-center">
                  <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/40">✕</div>
                  <div className="mt-2 text-lg font-bold text-white">2</div>
                  <div className="text-xs text-white/40">Cancelaciones</div>
                  <div className="text-[10px] text-red-400">-1 vs ayer</div>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#141414] p-5">
              <h2 className="text-xs font-bold tracking-[0.15em] text-white">ACCIONES RÁPIDAS</h2>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
                <button onClick={() => setShowCreate(true)} className="flex flex-col items-center gap-2 rounded-xl border border-white/5 bg-white/[0.03] p-3 hover:bg-white/[0.06]">
                  <FaFilm className="text-lg text-white/70" />
                  <span className="text-xs text-white/70">Nueva película</span>
                </button>
                <button onClick={() => setShowCreate(true)} className="flex flex-col items-center gap-2 rounded-xl border border-white/5 bg-white/[0.03] p-3 hover:bg-white/[0.06]">
                  <FaCalendarAlt className="text-lg text-white/70" />
                  <span className="text-xs text-white/70">Nueva función</span>
                </button>
                <button className="flex flex-col items-center gap-2 rounded-xl border border-white/5 bg-white/[0.03] p-3 opacity-50">
                  <FaClock className="text-lg text-white/40" />
                  <span className="text-xs text-white/40">Ver reportes</span>
                </button>
                <button className="flex flex-col items-center gap-2 rounded-xl border border-white/5 bg-white/[0.03] p-3 opacity-50">
                  <FaLightbulb className="text-lg text-white/40" />
                  <span className="text-xs text-white/40">Enviar aviso</span>
                </button>
              </div>
            </div>
          </div>

          {/* Gestión existente pero estilizada (mantiene funcionalidad) */}
          <div className="mt-6 rounded-xl border border-dashed border-white/10 bg-transparent p-4">
            <h3 className="text-xs font-bold tracking-wide text-white/60">Gestión de estados (MVP)</h3>
            <div className="mt-3 space-y-2">
              {(sugerencias || []).slice(0, 3).map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded bg-white/5 px-3 py-2">
                  <span className="text-xs text-white/80">
                    {s.titulo} · {s._count.votos} votos
                  </span>
                  <select value={s.estado} onChange={(e) => updateEstado(s.id, e.target.value)} className="rounded bg-black px-2 py-1 text-xs text-white">
                    <option value="PENDIENTE">PENDIENTE</option>
                    <option value="PROGRAMADA">PROGRAMADA</option>
                    <option value="DESCARTADA">DESCARTADA</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
