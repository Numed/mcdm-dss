import { type CompareResult, compareMethods } from './compareProject'
import { type GoalAggregation, aggregateGoal } from './goals'
import type { Matrix, Vector } from './matrix'
import type { Goal, Project } from './model'
import { toMembership } from './normalization'
import { SATISFACTION_TERMS, type SatisfactionScore, rankBySatisfaction } from './satisfaction'
import { type SecurityLevel, securityLevel } from './security'

export type AlternativeResult = {
  id: string
  name: string
  goalScores: Vector
  securityLevel: SecurityLevel
  passesSecurity: boolean
  satisfaction: SatisfactionScore | null
  rank: number | null
}

export type AnalysisResult = {
  target: Vector
  spread: Vector
  goals: (GoalAggregation | null)[]
  memberships: Matrix[][]
  alternatives: AlternativeResult[]
  ranking: AlternativeResult[]
  best: AlternativeResult | null
  comparison: CompareResult | null
}

export function satisfactionValue(goal: Goal): number {
  return SATISFACTION_TERMS[goal.satisfactionTerm]?.value ?? 0
}

export function goalMemberships(project: Project, goal: Goal): Matrix[] {
  const ids = project.alternatives.map((alternative) => alternative.id)
  return goal.groups
    .filter((group) => group.criteria.length > 0)
    .map((group) =>
      group.criteria.map((criterion) =>
        toMembership(
          ids.map((id) => criterion.values[id] ?? 0),
          criterion.direction,
        ),
      ),
    )
}

function clampUnit(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(Math.max(value, 0), 1)
}

export function analyze(project: Project): AnalysisResult {
  const ids = project.alternatives.map((alternative) => alternative.id)
  const target = project.goals.map(satisfactionValue)
  const memberships = project.goals.map((goal) => goalMemberships(project, goal))

  let goals: (GoalAggregation | null)[]
  let goalVectors: Vector[]
  if (project.inputMode === 'direct') {
    goals = project.goals.map(() => null)
    goalVectors = project.goals.map((goal) => ids.map((id) => clampUnit(goal.directScores[id] ?? 0)))
  } else {
    goals = memberships.map((matrices) =>
      matrices.length === 0 ? null : aggregateGoal(matrices, project.powerMeanOrder, project.goalNormalization),
    )
    goalVectors = goals.map((goal) => goal?.scores ?? ids.map(() => 0))
  }

  const base = project.alternatives.map((alternative, index) => {
    const goalScores = goalVectors.map((vector) => vector[index] ?? 0)
    const level = securityLevel(goalScores)
    return {
      id: alternative.id,
      name: alternative.name,
      goalScores,
      securityLevel: level,
      passesSecurity: level >= project.minSecurityLevel,
    }
  })

  const passing = base.filter((item) => item.passesSecurity)
  const { spread, scores } = rankBySatisfaction(
    passing.map((item) => item.goalScores),
    target,
  )
  const scoreById = new Map(passing.map((item, index) => [item.id, scores[index]]))
  const ordered = [...passing].sort((a, b) => {
    const difference = (scoreById.get(b.id)?.zStar ?? 0) - (scoreById.get(a.id)?.zStar ?? 0)
    if (Math.abs(difference) < 1e-9) return 0
    return difference
  })
  const rankById = new Map(ordered.map((item, index) => [item.id, index + 1]))

  const alternatives: AlternativeResult[] = base.map((item) => ({
    ...item,
    satisfaction: scoreById.get(item.id) ?? null,
    rank: rankById.get(item.id) ?? null,
  }))
  const ranking = ordered.map((item) => alternatives.find((alt) => alt.id === item.id)).filter(isDefined)

  const comparison =
    project.inputMode === 'criteria' && goals.every((goal) => goal !== null) && ranking.length > 1
      ? compareMethods(memberships, goals.filter(isDefined), target, alternatives)
      : null

  return { target, spread, goals, memberships, alternatives, ranking, best: ranking[0] ?? null, comparison }
}

function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}
