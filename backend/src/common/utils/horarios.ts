export const ZONA_HORARIA = 'America/Bogota';
export const HORA_FUNCION = 19;
export const HORA_CIERRE_VOTACION = 18;

export function fijarHora(date: Date, hour: number) {
  const result = new Date(date);
  result.setHours(hour, 0, 0, 0);
  return result;
}
