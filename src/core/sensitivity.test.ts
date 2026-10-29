import { describe, expect, it } from 'vitest'
import { analyze } from './analysis'
import { articleExample, bankDemo } from './presets'
import { competitionRanking, orderSensitivity, thresholdSensitivity, winnerGrid } from './sensitivity'

describe('sensitivity analysis', () => {
  it('gives tied alternatives the same competition rank', () => {
    expect(competitionRanking(analyze(articleExample()))).toEqual([1, 2, 2, 4, 4])
  })

  it('computes rankings for every power mean order', () => {
    const result = orderSensitivity(bankDemo())
    expect(result.map((item) => item.order)).toEqual([-1, 0, 1, 2])
    result.forEach((item) => expect(item.ranks).toHaveLength(6))
  })

  it('builds a 6 x 6 winner grid consistent with the current terms', () => {
    const project = articleExample()
    const grid = winnerGrid(project)
    expect(grid).toHaveLength(36)
    const current = grid.find(
      (cell) => cell.termX === project.goals[0].satisfactionTerm && cell.termY === project.goals[1].satisfactionTerm,
    )
    expect(current?.bestId).toBe(analyze(project).best?.id)
  })

  it('admits fewer alternatives as the security threshold grows', () => {
    const counts = thresholdSensitivity(articleExample()).map((item) => item.admissible)
    counts.slice(1).forEach((count, index) => expect(count).toBeLessThanOrEqual(counts[index]))
    expect(counts[0]).toBe(5)
  })
})
