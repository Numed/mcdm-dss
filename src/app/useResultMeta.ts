import { useMemo } from 'react'
import type { AnalysisResult } from '@/core/analysis'
import type { Project } from '@/core/model'
import { altColorVar } from '@/lib/colors'
import { type DisplayRank, competitionRanks } from '@/lib/ranking'
import { stripGoalPrefix } from '@/lib/utils'

export type ResultMeta = {
  colorById: Map<string, string>
  rankById: Map<string, DisplayRank>
  goalNames: string[]
  goalLabels: string[]
}

export function buildResultMeta(project: Project, analysis: AnalysisResult): ResultMeta {
  const colorById = new Map(
    project.alternatives.map((alternative, index) => [alternative.id, altColorVar(alternative.color ?? index)]),
  )
  const ranks = competitionRanks(analysis.ranking.map((alt) => alt.satisfaction?.zStar ?? 0))
  const rankById = new Map(analysis.ranking.map((alt, index) => [alt.id, ranks[index]]))
  const goalNames = project.goals.map((goal) => stripGoalPrefix(goal.name))
  const goalLabels = goalNames.map((name, index) => `G${index + 1}: ${name}`)
  return { colorById, rankById, goalNames, goalLabels }
}

export function useResultMeta(project: Project, analysis: AnalysisResult): ResultMeta {
  return useMemo(() => buildResultMeta(project, analysis), [project, analysis])
}
