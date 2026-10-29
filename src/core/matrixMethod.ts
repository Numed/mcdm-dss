import { type Matrix, type Vector, multiply, normalizeBySum, transpose } from './matrix'

export type PowerMeanOrder = -1 | 0 | 1 | 2

export const POWER_MEAN_LABELS: Record<PowerMeanOrder, string> = {
  [-1]: 'Гармонійне (t = -1)',
  0: 'Геометричне (t = 0)',
  1: 'Арифметичне (t = 1)',
  2: 'Квадратичне (t = 2)',
}

export function powerMean(values: Vector, order: PowerMeanOrder): number {
  const count = values.length
  if (count === 0) return 0
  if (order === 0) {
    if (values.some((value) => value <= 0)) return 0
    return Math.exp(values.reduce((acc, value) => acc + Math.log(value), 0) / count)
  }
  if (order === -1) {
    if (values.some((value) => value <= 0)) return 0
    return count / values.reduce((acc, value) => acc + 1 / value, 0)
  }
  const meanOfPowers = values.reduce((acc, value) => acc + value ** order, 0) / count
  return meanOfPowers ** (1 / order)
}

export type MatrixMethodResult = {
  criteriaWeights: Vector
  scores: Vector
}

export type MatrixMethodSteps = {
  decision: Matrix
  relation: Matrix
  normalizedRelation: Matrix
  importance: Vector
  criteriaWeights: Vector
  weighted: Matrix
  alternativesRelation: Matrix
  columnSums: Vector
  scores: Vector
}

export function matrixMultiplicationSteps(decision: Matrix, order: PowerMeanOrder): MatrixMethodSteps {
  const criteriaCount = decision.length
  const alternativesCount = criteriaCount === 0 ? 0 : decision[0].length
  if (criteriaCount === 0 || alternativesCount === 0) {
    return {
      decision,
      relation: [],
      normalizedRelation: [],
      importance: [],
      criteriaWeights: [],
      weighted: [],
      alternativesRelation: [],
      columnSums: [],
      scores: new Array<number>(alternativesCount).fill(0),
    }
  }

  const relation = multiply(decision, transpose(decision))
  const normalizedRelation = relation.map((row) => row.map((value) => value / alternativesCount))
  const importance = normalizedRelation.map((row) => powerMean(row, order))
  const criteriaWeights = normalizeBySum(importance)

  const weighted = decision.map((row, criterion) => row.map((value) => value * criteriaWeights[criterion]))
  const alternativesRelation = multiply(transpose(decision), weighted)
  const columnSums = alternativesRelation[0].map((_, col) =>
    alternativesRelation.reduce((acc, row) => acc + row[col], 0),
  )

  return {
    decision,
    relation,
    normalizedRelation,
    importance,
    criteriaWeights,
    weighted,
    alternativesRelation,
    columnSums,
    scores: normalizeBySum(columnSums),
  }
}

export function matrixMultiplicationMethod(decision: Matrix, order: PowerMeanOrder): MatrixMethodResult {
  const steps = matrixMultiplicationSteps(decision, order)
  return { criteriaWeights: steps.criteriaWeights, scores: steps.scores }
}
