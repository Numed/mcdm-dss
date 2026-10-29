import { type AnalysisResult, analyze } from './analysis'
import type { PowerMeanOrder } from './matrixMethod'
import type { Project } from './model'
import { SATISFACTION_TERMS } from './satisfaction'
import type { SecurityLevel } from './security'

const TIE_EPSILON = 1e-9

export const POWER_MEAN_ORDERS: PowerMeanOrder[] = [-1, 0, 1, 2]
export const SECURITY_THRESHOLDS: SecurityLevel[] = [1, 2, 3, 4, 5]

export type OrderSensitivity = {
  order: PowerMeanOrder
  ranks: (number | null)[]
  bestId: string | null
}

export type WinnerCell = {
  termX: number
  termY: number
  bestId: string | null
  tiedIds: string[]
  zStar: number
}

export type ThresholdSensitivity = {
  level: SecurityLevel
  admissible: number
  bestId: string | null
  zStar: number
}

export function competitionRanking(analysis: AnalysisResult): (number | null)[] {
  return analysis.alternatives.map((alternative) => {
    const zStar = alternative.satisfaction?.zStar
    if (zStar === undefined) return null
    const better = analysis.ranking.filter((other) => (other.satisfaction?.zStar ?? 0) - zStar > TIE_EPSILON).length
    return better + 1
  })
}

export function orderSensitivity(project: Project): OrderSensitivity[] {
  return POWER_MEAN_ORDERS.map((order) => {
    const analysis = analyze({ ...project, powerMeanOrder: order })
    return { order, ranks: competitionRanking(analysis), bestId: analysis.best?.id ?? null }
  })
}

export function winnerGrid(project: Project, goalX = 0, goalY = 1): WinnerCell[] {
  const cells: WinnerCell[] = []
  const goalIdX = project.goals[goalX]?.id
  const goalIdY = project.goals[goalY]?.id
  if (!goalIdX || !goalIdY) return cells
  SATISFACTION_TERMS.forEach((_, termY) => {
    SATISFACTION_TERMS.forEach((__, termX) => {
      const goals = project.goals.map((goal) => {
        if (goal.id === goalIdX) return { ...goal, satisfactionTerm: termX }
        if (goal.id === goalIdY) return { ...goal, satisfactionTerm: termY }
        return goal
      })
      const analysis = analyze({ ...project, goals })
      const best = analysis.best
      const zStar = best?.satisfaction?.zStar ?? 0
      const tiedIds = analysis.ranking
        .filter((alternative) => Math.abs((alternative.satisfaction?.zStar ?? 0) - zStar) < TIE_EPSILON)
        .map((alternative) => alternative.id)
      cells.push({ termX, termY, bestId: best?.id ?? null, tiedIds: best ? tiedIds : [], zStar })
    })
  })
  return cells
}

export function thresholdSensitivity(project: Project): ThresholdSensitivity[] {
  return SECURITY_THRESHOLDS.map((level) => {
    const analysis = analyze({ ...project, minSecurityLevel: level })
    return {
      level,
      admissible: analysis.ranking.length,
      bestId: analysis.best?.id ?? null,
      zStar: analysis.best?.satisfaction?.zStar ?? 0,
    }
  })
}
