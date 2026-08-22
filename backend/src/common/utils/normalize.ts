/**
 * Normaliza un título para detección de duplicados determinista.
 * Misma función debe usarse en backend al escribir y al consultar.
 * - NFD + strip diacríticos (incluye tildes, convierte ñ -> n intencionalmente para matching laxo)
 * - lower
 * - trim
 * - quita puntuación (solo a-z0-9 y espacios quedan)
 * - colapsa espacios múltiples a uno
 */
export function normalizeTitulo(titulo: string): string {
  return titulo
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '') // quita puntuación
    .replace(/\s+/g, ' '); // colapsa espacios
}

export function normalizeContacto(contacto: string): string {
  return contacto.trim().toLowerCase();
}
