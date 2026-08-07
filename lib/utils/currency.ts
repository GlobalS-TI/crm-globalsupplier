import type { Currency } from '@/lib/validations/opportunity'

const formatters: Record<Currency, Intl.NumberFormat> = {
  MXN: new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 }),
  USD: new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }),
}

export function formatMXN(amount: number): string {
  return formatters.MXN.format(amount)
}

export function formatCurrency(amount: number, currency: Currency): string {
  return formatters[currency].format(amount)
}

export function formatDualCurrency(amount: number, currency: Currency, mxnEquivalent: number): string {
  if (currency === 'MXN') return formatCurrency(amount, 'MXN')
  return `${formatCurrency(amount, currency)} (≈ ${formatMXN(mxnEquivalent)})`
}
