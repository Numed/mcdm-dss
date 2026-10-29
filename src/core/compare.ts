import type { Matrix, Vector } from './matrix'

export function topsis(decision: Matrix, weights: Vector): Vector {
  const alternativesCount = decision.length === 0 ? 0 : decision[0].length
  const weighted = decision.map((row, criterion) => {
    const norm = Math.sqrt(row.reduce((acc, value) => acc + value * value, 0))
    if (norm === 0) return row.map(() => 0)
    return row.map((value) => (value / norm) * weights[criterion])
  })
  const ideal = weighted.map((row) => Math.max(...row))
  const antiIdeal = weighted.map((row) => Math.min(...row))
  return Array.from({ length: alternativesCount }, (_, alt) => {
    let toIdeal = 0
    let toAnti = 0
    weighted.forEach((row, criterion) => {
      toIdeal += (row[alt] - ideal[criterion]) ** 2
      toAnti += (row[alt] - antiIdeal[criterion]) ** 2
    })
    const denominator = Math.sqrt(toIdeal) + Math.sqrt(toAnti)
    if (denominator === 0) return 0
    return Math.sqrt(toAnti) / denominator
  })
}

export type VikorResult = {
  s: Vector
  r: Vector
  q: Vector
}

export function vikor(decision: Matrix, weights: Vector, strategyWeight = 0.5): VikorResult {
  const alternativesCount = decision.length === 0 ? 0 : decision[0].length
  const best = decision.map((row) => Math.max(...row))
  const worst = decision.map((row) => Math.min(...row))
  const s: Vector = []
  const r: Vector = []
  for (let alt = 0; alt < alternativesCount; alt++) {
    let groupUtility = 0
    let individualRegret = 0
    decision.forEach((row, criterion) => {
      const range = best[criterion] - worst[criterion]
      if (range === 0) return
      const term = (weights[criterion] * (best[criterion] - row[alt])) / range
      groupUtility += term
      individualRegret = Math.max(individualRegret, term)
    })
    s.push(groupUtility)
    r.push(individualRegret)
  }
  const sMin = Math.min(...s)
  const sMax = Math.max(...s)
  const rMin = Math.min(...r)
  const rMax = Math.max(...r)
  const q = s.map((value, index) => {
    const sPart = sMax === sMin ? 0 : (value - sMin) / (sMax - sMin)
    const rPart = rMax === rMin ? 0 : (r[index] - rMin) / (rMax - rMin)
    return strategyWeight * sPart + (1 - strategyWeight) * rPart
  })
  return { s, r, q }
}

export function ranksDescending(values: Vector): number[] {
  const order = values
    .map((value, index) => ({ value, index }))
    .sort((a, b) => {
      const difference = b.value - a.value
      if (Math.abs(difference) < 1e-9) return 0
      return difference
    })
  const ranks = new Array<number>(values.length).fill(0)
  order.forEach((entry, position) => {
    ranks[entry.index] = position + 1
  })
  return ranks
}

export function ranksAscending(values: Vector): number[] {
  return ranksDescending(values.map((value) => -value))
}

export function spearman(left: number[], right: number[]): number {
  const count = left.length
  if (count < 2) return 1
  const squared = left.reduce((acc, rank, index) => acc + (rank - right[index]) ** 2, 0)
  return 1 - (6 * squared) / (count * (count * count - 1))
}
