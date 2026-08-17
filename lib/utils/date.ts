const BUSINESS_TZ = 'America/Mexico_City'

const dayKeyFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: BUSINESS_TZ,
  year:  'numeric',
  month: '2-digit',
  day:   '2-digit',
})

/**
 * "YYYY-MM-DD" del día calendario en la zona horaria del negocio (America/Mexico_City),
 * sin importar en qué timezone corre el runtime que lo llama. Comparar estas claves
 * como string equivale a comparar fechas (formato lexicográfico = cronológico).
 *
 * Necesario porque componentes 'use client' se renderizan una vez en el servidor
 * (Vercel corre en UTC) y se re-renderizan al hidratar en el navegador del usuario
 * (hora local de México) — usar `new Date().getDate()` directo da un "hoy" distinto
 * en cada pasada para horarios cercanos a la medianoche UTC, lo que se ve como si el
 * estado de la oportunidad "cambiara solo" justo al cargar la página.
 */
export function businessDayKey(date: Date): string {
  return dayKeyFormatter.format(date)
}
