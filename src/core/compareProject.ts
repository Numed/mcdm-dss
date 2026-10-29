import type { AlternativeResult } from './analysis'
import { ranksAscending, ranksDescending, spearman, topsis, vikor } from './compare'
import type { GoalAggregation } from './goals'
import { type Matrix, type Vector, normalizeBySum } from './matrix'

export type MethodRanking = {
  method: string
  scores: Vector
  ranks: number[]
  correlation: number
}

export type CompareResult = {
  alternativeIds: string[]
  criteriaWeights: Vector
  methods: MethodRanking[]
}

export function compareMethods(
  memberships: Matrix[][],
  goals: GoalAggregation[],
  target: Vector,
  alternatives: AlternativeResult[],
): CompareResult {
  const passing = alternatives.filter((alt) => alt.passesSecurity)
  const allIds = alternatives.map((alt) => alt.id)
  const columns = passing.map((alt) => allIds.indexOf(alt.id))
  const goalImportance = normalizeBySum(target.map((value) => (value > 0 ? value : 0)))

  const rows: Matrix = []
  const weights: Vector = []
  memberships.forEach((groups, goalIndex) => {
    groups.forEach((matrix, groupIndex) => {
      const groupWeight = goals[goalIndex].groupWeights[groupIndex] ?? 0
      const criteriaWeights = goals[goalIndex].groups[groupIndex].criteriaWeights
      matrix.forEach((row, criterionIndex) => {
        rows.push(columns.map((column) => row[column]))
        weights.push(goalImportance[goalIndex] * groupWeight * (criteriaWeights[criterionIndex] ?? 0))
      })
    })
  })
  const criteriaWeights = normalizeBySum(weights)

  const proposedScores = passing.map((alt) => alt.satisfaction?.zStar ?? 0)
  const proposedRanks = passing.map((alt) => alt.rank ?? 0)
  const topsisScores = topsis(rows, criteriaWeights)
  const topsisRanks = ranksDescending(topsisScores)
  const vikorResult = vikor(rows, criteriaWeights)
  const vikorRanks = ranksAscending(vikorResult.q)

  return {
    alternativeIds: passing.map((alt) => alt.id),
    criteriaWeights,
    methods: [
      { method: 'Запропонований (вектор задоволення)', scores: proposedScores, ranks: proposedRanks, correlation: 1 },
      { method: 'TOPSIS', scores: topsisScores, ranks: topsisRanks, correlation: spearman(proposedRanks, topsisRanks) },
      { method: 'VIKOR (Q, менше - краще)', scores: vikorResult.q, ranks: vikorRanks, correlation: spearman(proposedRanks, vikorRanks) },
    ],
  }
}
