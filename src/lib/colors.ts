import type { Alternative } from '@/core/model'
import type { SecurityLevel } from '@/core/security'

export function altColorVar(slot: number): string {
  return `var(--alt-${(slot % 8) + 1})`
}

export function alternativeColor(alternatives: Alternative[], id: string): string {
  const index = alternatives.findIndex((alternative) => alternative.id === id)
  const alternative = alternatives[index]
  return altColorVar(alternative?.color ?? Math.max(index, 0))
}

export function securityColorVar(level: SecurityLevel): string {
  return `var(--sec-${level})`
}

export function correlationColor(value: number): string {
  const clamped = Math.min(Math.max(value, -1), 1)
  if (clamped >= 0) return `color-mix(in srgb, var(--corr-pos) ${Math.round(clamped * 100)}%, var(--corr-mid))`
  return `color-mix(in srgb, var(--corr-neg) ${Math.round(-clamped * 100)}%, var(--corr-mid))`
}

export function goalColorVar(index: number): string {
  return `var(--goal-${(index % 4) + 1})`
}
