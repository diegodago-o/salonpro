/**
 * Utilidades de fecha/hora para Colombia (UTC-5, sin DST).
 * Usar siempre estas funciones en lugar de new Date() o toISOString()
 * para evitar desfases de zona horaria.
 */

const COLOMBIA_TZ = 'America/Bogota';

/**
 * Retorna la fecha actual en Colombia como string YYYY-MM-DD.
 * Ejemplo: si son las 11 PM del 25 en UTC, en Colombia son las 6 PM del 25.
 */
export function todayColombia(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: COLOMBIA_TZ }).format(new Date());
}

/**
 * Construye un ISO string para el INICIO del día en Colombia.
 * Ejemplo: "2026-05-26" → "2026-05-26T00:00:00" (sin Z, sin offset → se compara
 * directamente con las fechas almacenadas en Colombia en el backend).
 */
export function colombiaStartOfDay(dateStr: string): string {
  return `${dateStr}T00:00:00`;
}

/**
 * Construye un ISO string para el FIN del día en Colombia.
 * Ejemplo: "2026-05-26" → "2026-05-26T23:59:59"
 */
export function colombiaEndOfDay(dateStr: string): string {
  return `${dateStr}T23:59:59`;
}
