import { type Vector, euclideanNorm } from './matrix'

export const SATISFACTION_TERMS: { value: number; label: string }[] = [
  { value: 0, label: 'Немає потреби' },
  { value: 0.2, label: 'Можлива потреба' },
  { value: 0.4, label: 'Є, але незначна' },
  { value: 0.6, label: 'Є потреба' },
  { value: 0.8, label: 'Значна потреба' },
  { value: 1, label: 'Пріоритетна потреба' },
]

export type SatisfactionScore = {
  distance: Vector
  closeness: Vector
  z: Vector
  zStar: number
}

export type SatisfactionRanking = {
  spread: Vector
  scores: SatisfactionScore[]
}

function absoluteDifference(left: Vector, right: Vector): Vector {
  return left.map((value, index) => Math.abs(value - right[index]))
}

export function maximalSpread(points: Vector[], target: Vector): Vector {
  if (points.length === 0) return target.map(() => 0)
  const byLength = [...points].sort((a, b) => euclideanNorm(a) - euclideanNorm(b))
  const shortest = byLength[0]
  const longest = byLength[byLength.length - 1]
  const towardsShortest = absoluteDifference(target, shortest)
  const towardsLongest = absoluteDifference(longest, target)
  if (euclideanNorm(towardsShortest) >= euclideanNorm(towardsLongest)) return towardsShortest
  return towardsLongest
}

export function rankBySatisfaction(points: Vector[], target: Vector): SatisfactionRanking {
  const spread = maximalSpread(points, target)
  const scores = points.map((point) => {
    const distance = absoluteDifference(target, point)
    const closeness = distance.map((value, index) => Math.min(spread[index], value))
    const z = closeness.map((value) => 1 - value)
    const zStar = z.reduce((acc, value, index) => acc + value * target[index], 0)
    return { distance, closeness, z, zStar }
  })
  return { spread, scores }
}
