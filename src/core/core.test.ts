import { describe, expect, it } from 'vitest'
import { analyze } from './analysis'
import { ranksDescending, spearman, topsis, vikor } from './compare'
import { aggregateGoal } from './goals'
import { matrixMultiplicationMethod, powerMean } from './matrixMethod'
import { toMembership } from './normalization'
import { articleExample, bankDemo } from './presets'
import { maximalSpread, rankBySatisfaction } from './satisfaction'
import { securityLevel } from './security'

const articlePoints = [
  [0.8, 0.9],
  [0.7, 0.6],
  [0.9, 1],
  [0.1, 0.3],
  [0.8, 0.2],
]
const articleTarget = [0.4, 0.8]

describe('powerMean', () => {
  it('orders means: harmonic <= geometric <= arithmetic <= quadratic', () => {
    const values = [0.2, 0.5, 0.9]
    const means = ([-1, 0, 1, 2] as const).map((order) => powerMean(values, order))
    for (let i = 1; i < means.length; i++) expect(means[i]).toBeGreaterThanOrEqual(means[i - 1])
    expect(means[2]).toBeCloseTo(1.6 / 3)
  })
})

describe('matrixMultiplicationMethod', () => {
  const decision = [
    [0.9, 0.5, 0.3],
    [0.8, 0.6, 0.4],
    [0.7, 0.9, 0.2],
  ]

  it('returns normalized weights and scores', () => {
    const result = matrixMultiplicationMethod(decision, 1)
    expect(result.criteriaWeights.reduce((a, b) => a + b, 0)).toBeCloseTo(1)
    expect(result.scores.reduce((a, b) => a + b, 0)).toBeCloseTo(1)
  })

  it('ranks a dominating alternative first', () => {
    const result = matrixMultiplicationMethod(decision, 1)
    expect(ranksDescending(result.scores)).toEqual([1, 2, 3])
  })

  it('is invariant to scaling of the decision matrix', () => {
    const scaled = decision.map((row) => row.map((value) => value * 0.3))
    const a = matrixMultiplicationMethod(decision, 0).scores
    const b = matrixMultiplicationMethod(scaled, 0).scores
    a.forEach((value, index) => expect(b[index]).toBeCloseTo(value))
  })
})

describe('aggregateGoal', () => {
  it('uses the single group vector directly and rescales to max = 1', () => {
    const result = aggregateGoal([[[1, 0.5, 0.25]]], 1, 'max')
    expect(result.groupWeights).toEqual([1])
    expect(Math.max(...result.scores)).toBeCloseTo(1)
  })
})

describe('toMembership', () => {
  it('normalizes benefit and cost criteria into [0; 1]', () => {
    expect(toMembership([50, 100, 25], 'benefit')).toEqual([0.5, 1, 0.25])
    expect(toMembership([10, 20, 5], 'cost')).toEqual([0.5, 0.25, 1])
  })
})

describe('securityLevel', () => {
  it('is defined by the weakest goal coordinate', () => {
    expect(securityLevel([0.9, 1])).toBe(5)
    expect(securityLevel([0.8, 0.2])).toBe(2)
    expect(securityLevel([0.1, 0.3])).toBe(1)
    expect(securityLevel([0.6, 0.6])).toBe(4)
  })
})

describe('satisfaction vector ranking (article example)', () => {
  it('finds the maximal spread vector (0,3; 0,5)', () => {
    const spread = maximalSpread(articlePoints, articleTarget)
    expect(spread[0]).toBeCloseTo(0.3)
    expect(spread[1]).toBeCloseTo(0.5)
  })

  it('reproduces Z* for x1-x4 and picks x1 as the best alternative', () => {
    const { scores } = rankBySatisfaction(articlePoints, articleTarget)
    const zStar = scores.map((score) => score.zStar)
    expect(zStar[0]).toBeCloseTo(1)
    expect(zStar[1]).toBeCloseTo(0.92)
    expect(zStar[2]).toBeCloseTo(0.92)
    expect(zStar[3]).toBeCloseTo(0.68)
    expect(ranksDescending(zStar)[0]).toBe(1)
  })

  it('applies formula (19) to x5, giving closeness (0,3; 0,5) and Z* = 0,68', () => {
    const { scores } = rankBySatisfaction(articlePoints, articleTarget)
    expect(scores[4].closeness[0]).toBeCloseTo(0.3)
    expect(scores[4].closeness[1]).toBeCloseTo(0.5)
    expect(scores[4].zStar).toBeCloseTo(0.68)
  })
})

describe('TOPSIS and VIKOR', () => {
  const decision = [
    [1, 0.5, 0.2],
    [0.9, 0.6, 0.1],
  ]
  it('agree on a dominating alternative', () => {
    const weights = [0.5, 0.5]
    expect(ranksDescending(topsis(decision, weights))[0]).toBe(1)
    const q = vikor(decision, weights).q
    expect(q[0]).toBeCloseTo(0)
  })
  it('computes Spearman correlation', () => {
    expect(spearman([1, 2, 3], [1, 2, 3])).toBe(1)
    expect(spearman([1, 2, 3], [3, 2, 1])).toBe(-1)
  })
})

describe('analyze', () => {
  it('ranks the article example with x1 first', () => {
    const result = analyze(articleExample())
    expect(result.best?.name).toBe('x1')
    expect(result.ranking.map((item) => item.name)).toEqual(['x1', 'x2', 'x3', 'x4', 'x5'])
  })

  it('filters alternatives by the security level', () => {
    const project = { ...articleExample(), minSecurityLevel: 3 as const }
    const result = analyze(project)
    expect(result.ranking.map((item) => item.name)).toEqual(['x1', 'x2', 'x3'])
  })

  it('runs the full criteria pipeline on the bank demo', () => {
    const result = analyze(bankDemo())
    expect(result.goals.every((goal) => goal !== null)).toBe(true)
    expect(result.ranking.length).toBeGreaterThan(1)
    expect(result.comparison?.methods).toHaveLength(3)
    result.alternatives.forEach((alt) => alt.goalScores.forEach((score) => expect(score).toBeLessThanOrEqual(1)))
  })
})
