import { describe, expect, it } from 'vitest'
import { analyze } from '@/core/analysis'
import { articleExample } from '@/core/presets'
import { competitionRanks, formatRank } from './ranking'

describe('competitionRanks', () => {
  it('gives tied alternatives the same rank and skips the next one', () => {
    expect(competitionRanks([1, 0.92, 0.92, 0.68]).map(formatRank)).toEqual(['1', '2=', '2=', '4'])
  })

  it('shows the article example as x1, x2 = x3, x4 = x5', () => {
    const result = analyze(articleExample())
    const zStar = result.ranking.map((alt) => alt.satisfaction?.zStar ?? 0)
    expect(result.ranking.map((alt) => alt.name)).toEqual(['x1', 'x2', 'x3', 'x4', 'x5'])
    expect(zStar.map((value) => Math.round(value * 100) / 100)).toEqual([1, 0.92, 0.92, 0.68, 0.68])
    expect(competitionRanks(zStar).map(formatRank)).toEqual(['1', '2=', '2=', '4=', '4='])
  })
})
