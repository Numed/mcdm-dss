import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(value: number, digits = 3): string {
  if (!Number.isFinite(value)) return '-'
  return value.toLocaleString('uk-UA', { minimumFractionDigits: 0, maximumFractionDigits: digits })
}

export function formatFixed(value: number, digits = 3): string {
  if (!Number.isFinite(value)) return '-'
  return value.toLocaleString('uk-UA', { minimumFractionDigits: digits, maximumFractionDigits: digits, useGrouping: false })
}

export function formatVector(values: number[], digits = 3): string {
  return `(${values.map((value) => formatFixed(value, digits)).join('; ')})`
}

export function formatPercent(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return '-'
  return `${(value * 100).toLocaleString('uk-UA', { minimumFractionDigits: digits, maximumFractionDigits: digits })} %`
}

export function pluralUk(count: number, one: string, few: string, many: string): string {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}

export function stripGoalPrefix(name: string): string {
  return name.replace(/^G\d+:\s*/, '')
}
