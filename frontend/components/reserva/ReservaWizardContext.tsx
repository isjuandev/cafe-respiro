"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";

export interface TipoEntrada {
  id: string;
  nombre: string;
  precio: number;
  descripcion?: string | null;
  orden: number;
}

export interface FuncionDetalle {
  id: string;
  peliculaId: string;
  pelicula: {
    id: string;
    titulo: string;
    director?: string | null;
    anio?: number | null;
    genero?: string | null;
    duracionMin?: number | null;
    sinopsis?: string | null;
    posterUrl?: string | null;
  };
  fechaHora: string;
  cupoTotal: number;
  cuposOcupados: number;
  cuposDisponibles: number;
}

export interface PagoInfo {
  banco: string;
  tipoCuenta: string;
  numeroCuenta: string;
  titular: string;
  documento?: string | null;
  qrImageUrl?: string | null;
  telefonoWp?: string;
  instrucciones?: string | null;
}

export interface AuthUserInfo {
  id?: string;
  sub?: string;
  nombre?: string;
  contacto?: string;
  role?: string;
}

export interface ReservaWizardState {
  funcionId: string;
  funcion: FuncionDetalle | null;
  tiposEntrada: TipoEntrada[];
  cantidades: Record<string, number>; // tipoEntradaId -> cantidad
  nombre: string;
  contacto: string;
  email: string;
  aceptoTerminos: boolean;
  pagoInfo: PagoInfo | null;
  authUser: AuthUserInfo | null;
  loading: boolean;
  error: string | null;
}

interface ReservaWizardContextType extends ReservaWizardState {
  setCantidad: (tipoEntradaId: string, cantidad: number) => void;
  incrementCantidad: (tipoEntradaId: string) => void;
  decrementCantidad: (tipoEntradaId: string) => void;
  setNombre: (nombre: string) => void;
  setContacto: (contacto: string) => void;
  setEmail: (email: string) => void;
  setAceptoTerminos: (acepto: boolean) => void;
  totalEntradas: number;
  totalPrecio: number;
  itemsSeleccionados: Array<{ tipo: TipoEntrada; cantidad: number; subtotal: number }>;
  resetForm: () => void;
  limpiarDatosContacto: () => void;
}

const ReservaWizardContext = createContext<ReservaWizardContextType | null>(null);

export function ReservaWizardProvider({
  funcionId,
  children,
}: {
  funcionId: string;
  children: React.ReactNode;
}) {
  const [funcion, setFuncion] = useState<FuncionDetalle | null>(null);
  const [tiposEntrada, setTiposEntrada] = useState<TipoEntrada[]>([]);
  const [cantidades, setCantidades] = useState<Record<string, number>>({});
  const [nombre, setNombre] = useState("");
  const [contacto, setContacto] = useState("");
  const [email, setEmail] = useState("");
  const [aceptoTerminos, setAceptoTerminos] = useState(false);
  const [pagoInfo, setPagoInfo] = useState<PagoInfo | null>(null);
  const [authUser, setAuthUser] = useState<AuthUserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const storageKey = `reserva_wizard_${funcionId}`;

  // Limpiar todas las reservas del storage
  const clearAllWizardStorage = useCallback(() => {
    try {
      if (typeof window !== "undefined") {
        Object.keys(sessionStorage).forEach((key) => {
          if (key.startsWith("reserva_wizard_")) {
            sessionStorage.removeItem(key);
          }
        });
      }
    } catch {}
  }, []);

  // Cargar función, tipos de entrada y datos de autenticación
  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoading(true);
        setError(null);

        const [funcRes, tiposRes, pagoRes, userRes] = await Promise.all([
          fetch("/api/funciones"),
          fetch("/api/tipos-entrada"),
          fetch("/api/configuracion-pago"),
          fetch("/api/auth/me", { credentials: "include" }),
        ]);

        if (!funcRes.ok) throw new Error("Error al cargar la información de la función");
        const funcData = await funcRes.json();
        const found = (funcData.funciones || []).find((f: FuncionDetalle) => f.id === funcionId);
        if (!found) throw new Error("La función solicitada no fue encontrada o ya finalizó");
        setFuncion(found);

        if (tiposRes.ok) {
          const tiposData = await tiposRes.json();
          setTiposEntrada(tiposData.tiposEntrada || []);
        }

        if (pagoRes.ok) {
          const pagoData = await pagoRes.json();
          setPagoInfo(pagoData);
        }

        // Manejo de usuario y auto-completado
        let currentUser: AuthUserInfo | null = null;
        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData.user) {
            currentUser = userData.user;
            setAuthUser(currentUser);
          } else {
            setAuthUser(null);
          }
        } else {
          setAuthUser(null);
        }

        // Si el usuario está autenticado, autocompletar con sus credenciales frescas
        if (currentUser) {
          if (currentUser.nombre) setNombre(currentUser.nombre);
          if (currentUser.contacto) {
            if (currentUser.contacto.includes("@")) {
              setEmail(currentUser.contacto);
            } else {
              setContacto(currentUser.contacto);
            }
          }
        } else {
          // Si el usuario es anónimo, NO restaurar datos de usuario previo
          // Solo restaurar cantidades si existen en esta pestaña
          try {
            const saved = sessionStorage.getItem(storageKey);
            if (saved) {
              const parsed = JSON.parse(saved);
              if (parsed.owner === "anon") {
                if (parsed.cantidades) setCantidades(parsed.cantidades);
                if (parsed.nombre) setNombre(parsed.nombre);
                if (parsed.contacto) setContacto(parsed.contacto);
                if (parsed.email) setEmail(parsed.email);
              } else {
                // Pertenecía a un usuario logueado anterior que cerró sesión -> limpiar
                sessionStorage.removeItem(storageKey);
              }
            }
          } catch {}
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, [funcionId, storageKey]);

  // Guardar en sessionStorage solo para la sesión activa
  useEffect(() => {
    if (loading) return;
    try {
      const owner = authUser ? (authUser.sub || authUser.id || "user") : "anon";
      sessionStorage.setItem(
        storageKey,
        JSON.stringify({
          owner,
          cantidades,
          nombre,
          contacto,
          email,
          aceptoTerminos,
        })
      );
    } catch {}
  }, [cantidades, nombre, contacto, email, aceptoTerminos, storageKey, authUser, loading]);

  const setCantidad = (tipoEntradaId: string, cantidad: number) => {
    setCantidades((prev) => ({
      ...prev,
      [tipoEntradaId]: Math.max(0, cantidad),
    }));
  };

  const incrementCantidad = (tipoEntradaId: string) => {
    setCantidades((prev) => {
      const current = prev[tipoEntradaId] || 0;
      const totalActual = Object.values(prev).reduce((s, v) => s + v, 0);
      const cuposDisponibles = funcion?.cuposDisponibles ?? 16;
      if (totalActual >= cuposDisponibles) return prev;
      return {
        ...prev,
        [tipoEntradaId]: current + 1,
      };
    });
  };

  const decrementCantidad = (tipoEntradaId: string) => {
    setCantidades((prev) => {
      const current = prev[tipoEntradaId] || 0;
      if (current <= 0) return prev;
      return {
        ...prev,
        [tipoEntradaId]: current - 1,
      };
    });
  };

  const resetForm = useCallback(() => {
    setCantidades({});
    setNombre("");
    setContacto("");
    setEmail("");
    setAceptoTerminos(false);
    clearAllWizardStorage();
  }, [clearAllWizardStorage]);

  const limpiarDatosContacto = useCallback(() => {
    setNombre("");
    setContacto("");
    setEmail("");
    try {
      sessionStorage.removeItem(storageKey);
    } catch {}
  }, [storageKey]);

  const itemsSeleccionados = useMemo(() => {
    return tiposEntrada
      .map((tipo) => {
        const cant = cantidades[tipo.id] || 0;
        return {
          tipo,
          cantidad: cant,
          subtotal: cant * tipo.precio,
        };
      })
      .filter((i) => i.cantidad > 0);
  }, [tiposEntrada, cantidades]);

  const totalEntradas = useMemo(() => {
    return itemsSeleccionados.reduce((sum, item) => sum + item.cantidad, 0);
  }, [itemsSeleccionados]);

  const totalPrecio = useMemo(() => {
    return itemsSeleccionados.reduce((sum, item) => sum + item.subtotal, 0);
  }, [itemsSeleccionados]);

  return (
    <ReservaWizardContext.Provider
      value={{
        funcionId,
        funcion,
        tiposEntrada,
        cantidades,
        nombre,
        contacto,
        email,
        aceptoTerminos,
        pagoInfo,
        authUser,
        loading,
        error,
        setCantidad,
        incrementCantidad,
        decrementCantidad,
        setNombre,
        setContacto,
        setEmail,
        setAceptoTerminos,
        totalEntradas,
        totalPrecio,
        itemsSeleccionados,
        resetForm,
        limpiarDatosContacto,
      }}
    >
      {children}
    </ReservaWizardContext.Provider>
  );
}

export function useReservaWizard() {
  const ctx = useContext(ReservaWizardContext);
  if (!ctx) {
    throw new Error("useReservaWizard debe ser usado dentro de un ReservaWizardProvider");
  }
  return ctx;
}
