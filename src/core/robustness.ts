import { analyze } from './analysis'
import type { Goal, Project } from './model'
import { competitionRanking } from './sensitivity'

export type RobustnessOptions = {
  noise: number
  runs: number
  seed?: number
}

export type AlternativeRobustness = {
  id: string
  rankCounts: number[]
  excluded: number
  winShare: number
  meanRank: number | null
  meanZStar: number | null
}

export type RobustnessResult = {
  runs: number
  noise: number
  alternatives: AlternativeRobustness[]
  baselineWinnerId: string | null
  baselineWinRate: number
}

export function seededRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

function jitter(value: number, noise: number, random: () => number): number {
  return value * (1 + (random() * 2 - 1) * noise)
}

function perturbGoal(goal: Goal, project: Project, noise: number, random: () => number): Goal {
  if (project.inputMode === 'direct') {
    const directScores: Record<string, number> = {}
    project.alternatives.forEach((alternative) => {
      const value = jitter(goal.directScores[alternative.id] ?? 0, noise, random)
      directScores[alternative.id] = Math.min(Math.max(value, 0), 1)
    })
    return { ...goal, directScores }
  }
  return {
    ...goal,
    groups: goal.groups.map((group) => ({
      ...group,
      criteria: group.criteria.map((criterion) => {
        const values: Record<string, number> = {}
        project.alternatives.forEach((alternative) => {
          values[alternative.id] = jitter(criterion.values[alternative.id] ?? 0, noise, random)
        })
        return { ...criterion, values }
      }),
    })),
  }
}

export function perturbProject(project: Project, noise: number, random: () => number): Project {
  return { ...project, goals: project.goals.map((goal) => perturbGoal(goal, project, noise, random)) }
}

export function robustnessAnalysis(project: Project, options: RobustnessOptions): RobustnessResult {
  const { noise, runs, seed = 20190966 } = options
  const random = seededRandom(seed)
  const count = project.alternatives.length
  const baseline = analyze(project)
  const baselineWinnerId = baseline.best?.id ?? null
  const rankCounts = project.alternatives.map(() => new Array<number>(count).fill(0))
  const excluded = new Array<number>(count).fill(0)
  const winShares = new Array<number>(count).fill(0)
  const rankSums = new Array<number>(count).fill(0)
  const zStarSums = new Array<number>(count).fill(0)
  const baselineIndex = project.alternatives.findIndex((alternative) => alternative.id === baselineWinnerId)
  let baselineWins = 0

  for (let run = 0; run < runs; run++) {
    const analysis = analyze(perturbProject(project, noise, random))
    const ranks = competitionRanking(analysis)
    const winners = ranks.filter((rank) => rank === 1).length
    ranks.forEach((rank, index) => {
      if (rank === null) {
        excluded[index] += 1
        return
      }
      rankCounts[index][rank - 1] += 1
      rankSums[index] += rank
      zStarSums[index] += analysis.alternatives[index]?.satisfaction?.zStar ?? 0
      if (rank === 1) winShares[index] += 1 / winners
    })
    if (baselineIndex >= 0 && ranks[baselineIndex] === 1) baselineWins += 1 / winners
  }

  return {
    runs,
    noise,
    baselineWinnerId,
    baselineWinRate: runs > 0 ? baselineWins / runs : 0,
    alternatives: project.alternatives.map((alternative, index) => {
      const admitted = runs - excluded[index]
      return {
        id: alternative.id,
        rankCounts: rankCounts[index],
        excluded: excluded[index],
        winShare: runs > 0 ? winShares[index] / runs : 0,
        meanRank: admitted > 0 ? rankSums[index] / admitted : null,
        meanZStar: admitted > 0 ? zStarSums[index] / admitted : null,
      }
    }),
  }
}
