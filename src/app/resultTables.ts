import type { AnalysisResult } from '@/core/analysis'
import type { Project } from '@/core/model'
import { SECURITY_LEVELS } from '@/core/security'
import { competitionRanks, formatRank } from '@/lib/ranking'
import { formatFixed, formatVector, stripGoalPrefix } from '@/lib/utils'

export type Cell = string | number

export type DataTable = {
  title: string
  headers: string[]
  rows: Cell[][]
}

export function targetSum(analysis: AnalysisResult): number {
  return analysis.target.reduce((acc, value) => acc + value, 0)
}

export function normalizedZ(zStar: number, analysis: AnalysisResult): number {
  const total = targetSum(analysis)
  return total > 0 ? zStar / total : 0
}

export function rankingTable(project: Project, analysis: AnalysisResult): DataTable {
  const ranks = competitionRanks(analysis.ranking.map((alt) => alt.satisfaction?.zStar ?? 0))
  const rankById = new Map(analysis.ranking.map((alt, index) => [alt.id, ranks[index]]))
  const excluded = analysis.alternatives.filter((alt) => !alt.passesSecurity)
  const goalHeaders = project.goals.map((goal, index) => `G${index + 1}: ${stripGoalPrefix(goal.name)}`)
  return {
    title: 'Ранжувальний ряд альтернатив',
    headers: ['Ранг', 'Альтернатива', ...goalHeaders, 'Безпека', 'n', 'μ', 'Z', 'Z*', 'Z*/Σt'],
    rows: [...analysis.ranking, ...excluded].map((alt) => {
      const rank = rankById.get(alt.id)
      const satisfaction = alt.satisfaction
      return [
        rank ? formatRank(rank) : '-',
        alt.name,
        ...alt.goalScores,
        `B${alt.securityLevel}${alt.passesSecurity ? '' : ' (відсіяно)'}`,
        satisfaction ? formatVector(satisfaction.distance) : '-',
        satisfaction ? formatVector(satisfaction.closeness) : '-',
        satisfaction ? formatVector(satisfaction.z) : '-',
        satisfaction ? satisfaction.zStar : '-',
        satisfaction ? normalizedZ(satisfaction.zStar, analysis) : '-',
      ]
    }),
  }
}

export function summaryTable(project: Project, analysis: AnalysisResult): DataTable {
  return {
    title: 'Параметри розрахунку',
    headers: ['Параметр', 'Значення'],
    rows: [
      ['Проєкт', project.title],
      ['Вектор задоволення T', formatVector(analysis.target, 1)],
      ['Максимальне відхилення m', formatVector(analysis.spread)],
      ['Поріг безпеки', `B${project.minSecurityLevel}: ${SECURITY_LEVELS[project.minSecurityLevel - 1].label}`],
      ['Порядок середнього t', project.inputMode === 'criteria' ? String(project.powerMeanOrder) : 'не використовується'],
      ['Найкраща альтернатива', analysis.best?.name ?? 'немає'],
    ],
  }
}

export function comparisonTable(project: Project, analysis: AnalysisResult): DataTable | null {
  const comparison = analysis.comparison
  if (!comparison) return null
  const nameById = new Map(project.alternatives.map((alt) => [alt.id, alt.name]))
  return {
    title: 'Порівняння методів',
    headers: ['Альтернатива', ...comparison.methods.flatMap((method) => [`${method.method}: оцінка`, `${method.method}: ранг`])],
    rows: comparison.alternativeIds.map((id, index) => [
      nameById.get(id) ?? id,
      ...comparison.methods.flatMap((method) => [method.scores[index], String(method.ranks[index])]),
    ]),
  }
}

const NUMERIC_TEXT = /^[-−]?\d[\d\s\u00a0]*(,\d+)?$/

export function isNumericCell(cell: Cell): boolean {
  return typeof cell === 'number' || NUMERIC_TEXT.test(cell)
}

export function cellText(cell: Cell): string {
  if (typeof cell === 'number') return formatFixed(cell)
  return cell
}
