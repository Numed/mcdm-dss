import { type Matrix, type Vector, normalizeByMax } from './matrix'
import { type MatrixMethodResult, type PowerMeanOrder, matrixMultiplicationMethod } from './matrixMethod'

export type GoalNormalization = 'sum' | 'max'

export const GOAL_NORMALIZATION_LABELS: Record<GoalNormalization, string> = {
  max: 'Відносно найкращої альтернативи (max = 1)',
  sum: 'Сума оцінок дорівнює 1',
}

export type GoalAggregation = {
  groups: MatrixMethodResult[]
  groupWeights: Vector
  rawScores: Vector
  scores: Vector
}

export function aggregateGoal(
  groupMatrices: Matrix[],
  order: PowerMeanOrder,
  normalization: GoalNormalization,
): GoalAggregation {
  const groups = groupMatrices.map((matrix) => matrixMultiplicationMethod(matrix, order))
  const firstLevel = groups.map((group) => group.scores)

  let rawScores: Vector
  let groupWeights: Vector
  if (firstLevel.length === 1) {
    rawScores = firstLevel[0]
    groupWeights = [1]
  } else {
    const secondLevel = matrixMultiplicationMethod(firstLevel, order)
    rawScores = secondLevel.scores
    groupWeights = secondLevel.criteriaWeights
  }

  const scores = normalization === 'max' ? normalizeByMax(rawScores) : rawScores
  return { groups, groupWeights, rawScores, scores }
}
