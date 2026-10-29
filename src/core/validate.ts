import type { Project } from './model'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasArray(value: Record<string, unknown>, key: string): boolean {
  return Array.isArray(value[key])
}

export function isProject(value: unknown): value is Project {
  if (!isRecord(value)) return false
  if (!hasArray(value, 'alternatives') || !hasArray(value, 'goals')) return false
  if (value.inputMode !== 'criteria' && value.inputMode !== 'direct') return false
  if (![-1, 0, 1, 2].includes(Number(value.powerMeanOrder))) return false
  if (value.goalNormalization !== 'sum' && value.goalNormalization !== 'max') return false
  if (![1, 2, 3, 4, 5].includes(Number(value.minSecurityLevel))) return false
  const goals = value.goals
  if (!Array.isArray(goals)) return false
  return goals.every((goal) => isRecord(goal) && hasArray(goal, 'groups') && isRecord(goal.directScores))
}
