import { describe, expect, it } from 'vitest'
import { analyze } from './analysis'
import { articleExample, bankDemo } from './presets'
import { robustnessAnalysis, seededRandom } from './robustness'

describe('robustnessAnalysis', () => {
  it('is reproducible for the same seed', () => {
    const a = seededRandom(7)
    const b = seededRandom(7)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })

  it('keeps the baseline winner in every run without noise', () => {
    const project = bankDemo()
    const result = robustnessAnalysis(project, { noise: 0, runs: 20 })
    expect(result.baselineWinnerId).toBe(analyze(project).best?.id)
    expect(result.baselineWinRate).toBeCloseTo(1)
  })

  it('accounts for every run of every alternative', () => {
    const result = robustnessAnalysis(bankDemo(), { noise: 0.1, runs: 200 })
    result.alternatives.forEach((alternative) => {
      const total = alternative.rankCounts.reduce((sum, value) => sum + value, 0) + alternative.excluded
      expect(total).toBe(200)
    })
    const winShares = result.alternatives.reduce((sum, alternative) => sum + alternative.winShare, 0)
    expect(winShares).toBeCloseTo(1)
  })

  it('splits wins between tied alternatives in the article example', () => {
    const result = robustnessAnalysis(articleExample(), { noise: 0, runs: 10 })
    expect(result.alternatives[0].winShare).toBeCloseTo(1)
    expect(result.alternatives[1].rankCounts[1]).toBe(10)
    expect(result.alternatives[2].rankCounts[1]).toBe(10)
  })
})

describe('robustness performance', () => {
  it('runs 1000 scenarios of the bank demo quickly', () => {
    const start = performance.now()
    const result = robustnessAnalysis(bankDemo(), { noise: 0.1, runs: 1000 })
    expect(performance.now() - start).toBeLessThan(5000)
    expect(result.runs).toBe(1000)
  })
})
