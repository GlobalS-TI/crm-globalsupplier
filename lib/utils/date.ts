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

/**
 * Instante (ISO UTC) en que empieza el día calendario `dayKey` ("YYYY-MM-DD") en la zona
 * del negocio. México eliminó el horario de verano en 2022, así que America/Mexico_City
 * es UTC-6 todo el año — si eso volviera a cambiar, este offset fijo deja de ser válido.
 */
export function businessDayStartISO(dayKey: string): string {
  return new Date(`${dayKey}T00:00:00-06:00`).toISOString()
}

/** "YYYY-MM-DD" del día siguiente a `dayKey` (aritmética de calendario, sin zona horaria). */
export function nextDayKey(dayKey: string): string {
  const [y, m, d] = dayKey.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10)
}

const dateTimeFormatter = new Intl.DateTimeFormat('sv-SE', {
  timeZone: BUSINESS_TZ,
  year:   'numeric',
  month:  '2-digit',
  day:    '2-digit',
  hour:   '2-digit',
  minute: '2-digit',
})

const shortDateFormatter = new Intl.DateTimeFormat('es-MX', {
  timeZone: BUSINESS_TZ,
  day:   '2-digit',
  month: 'short',
  year:  'numeric',
})

/** "YYYY-MM-DD HH:mm" en la zona del negocio — ordenable como texto, pensado para exportar. */
export function formatBusinessDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso))
}

/** "02 nov 2026" en la zona del negocio — para tablas. */
export function formatBusinessDate(iso: string): string {
  return shortDateFormatter.format(new Date(iso))
}
