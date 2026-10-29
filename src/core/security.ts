import type { Vector } from './matrix'

export type SecurityLevel = 1 | 2 | 3 | 4 | 5

export const SECURITY_LEVELS: { level: SecurityLevel; label: string; range: string }[] = [
  { level: 1, label: 'Дуже низький', range: '[0; 0,2)' },
  { level: 2, label: 'Низький', range: '[0,2; 0,4)' },
  { level: 3, label: 'Середній', range: '[0,4; 0,6)' },
  { level: 4, label: 'Вище середнього', range: '[0,6; 0,8)' },
  { level: 5, label: 'Стабільно високий', range: '[0,8; 1]' },
]

const LEVEL_BY_INDEX: SecurityLevel[] = [1, 2, 3, 4, 5]

export function securityLevel(point: Vector): SecurityLevel {
  if (point.length === 0) return 1
  const weakest = Math.min(...point)
  const index = Math.min(Math.max(Math.floor(weakest / 0.2 + 1e-9), 0), 4)
  return LEVEL_BY_INDEX[index]
}
