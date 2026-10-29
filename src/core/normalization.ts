import type { Vector } from './matrix'

export type CriterionDirection = 'benefit' | 'cost'

export function toMembership(values: Vector, direction: CriterionDirection): Vector {
  const finite = values.map((value) => (Number.isFinite(value) ? value : 0))
  if (direction === 'benefit') {
    const max = Math.max(...finite)
    if (max <= 0) return finite.map(() => 0)
    return finite.map((value) => Math.max(value, 0) / max)
  }
  const positive = finite.filter((value) => value > 0)
  if (positive.length === 0) return finite.map(() => 0)
  const min = Math.min(...positive)
  return finite.map((value) => (value > 0 ? min / value : 0))
}
