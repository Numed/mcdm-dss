import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(value: number, digits = 3): string {
  if (!Number.isFinite(value)) return '-'
  return value.toLocaleString('uk-UA', { minimumFractionDigits: 0, maximumFractionDigits: digits })
}
