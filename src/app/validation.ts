import type { AnalysisResult } from '@/core/analysis'
import type { Project } from '@/core/model'
import { pluralUk } from '@/lib/utils'
import type { RouteId } from './routes'

export type IssueLevel = 'error' | 'warning'

export type Issue = {
  id: string
  level: IssueLevel
  route: RouteId
  message: string
  goalId?: string
  groupId?: string
}

export type CellFlag = 'negative' | 'zero-cost' | 'zero' | null

export function cellFlag(value: number | undefined, direction: 'benefit' | 'cost'): CellFlag {
  if (value === undefined || !Number.isFinite(value)) return 'zero'
  if (value < 0) return 'negative'
  if (value === 0 && direction === 'cost') return 'zero-cost'
  if (value === 0) return 'zero'
  return null
}

export function criteriaCount(project: Project): number {
  return project.goals.reduce(
    (total, goal) => total + goal.groups.reduce((sum, group) => sum + group.criteria.length, 0),
    0,
  )
}

export function validateProject(project: Project, analysis: AnalysisResult): Issue[] {
  const issues: Issue[] = []

  if (project.alternatives.length < 2) {
    issues.push({ id: 'alts-count', level: 'error', route: 'alternatives', message: 'Потрібно щонайменше 2 альтернативи' })
  }
  if (project.goals.length === 0) {
    issues.push({ id: 'goals-count', level: 'error', route: 'goals', message: 'Додайте хоча б одну ціль' })
  }
  project.alternatives.forEach((alternative, index) => {
    if (alternative.name.trim() === '') {
      issues.push({
        id: `alt-name-${alternative.id}`,
        level: 'warning',
        route: 'alternatives',
        message: `Альтернатива x${index + 1} не має назви`,
      })
    }
  })

  if (project.inputMode === 'criteria') {
    project.goals.forEach((goal) => {
      const total = goal.groups.reduce((sum, group) => sum + group.criteria.length, 0)
      if (total === 0) {
        issues.push({
          id: `goal-empty-${goal.id}`,
          level: 'error',
          route: 'goals',
          message: `Ціль «${goal.name}» не має жодного критерію`,
          goalId: goal.id,
        })
      }
      goal.groups.forEach((group) => {
        if (group.criteria.length === 0 && total > 0) {
          issues.push({
            id: `group-empty-${group.id}`,
            level: 'warning',
            route: 'goals',
            message: `Група «${group.name}» порожня і не враховується`,
            goalId: goal.id,
            groupId: group.id,
          })
        }
        let negative = 0
        let zeroCost = 0
        group.criteria.forEach((criterion) => {
          project.alternatives.forEach((alternative) => {
            const flag = cellFlag(criterion.values[alternative.id], criterion.direction)
            if (flag === 'negative') negative += 1
            if (flag === 'zero-cost') zeroCost += 1
          })
        })
        if (negative > 0) {
          issues.push({
            id: `negative-${group.id}`,
            level: 'error',
            route: 'goals',
            message: `«${group.name}»: ${negative} ${pluralUk(negative, 'від’ємне значення', 'від’ємні значення', 'від’ємних значень')}, функція належності для них дорівнює 0`,
            goalId: goal.id,
            groupId: group.id,
          })
        }
        if (zeroCost > 0) {
          issues.push({
            id: `zero-cost-${group.id}`,
            level: 'warning',
            route: 'goals',
            message: `«${group.name}»: ${zeroCost} ${pluralUk(zeroCost, 'нуль', 'нулі', 'нулів')} у критерії мінімізації, min/x не визначено`,
            goalId: goal.id,
            groupId: group.id,
          })
        }
      })
    })
  } else {
    project.goals.forEach((goal) => {
      const outside = project.alternatives.filter((alternative) => {
        const value = goal.directScores[alternative.id] ?? 0
        return value < 0 || value > 1
      }).length
      if (outside > 0) {
        issues.push({
          id: `direct-range-${goal.id}`,
          level: 'warning',
          route: 'goals',
          message: `«${goal.name}»: ${outside} ${pluralUk(outside, 'оцінка', 'оцінки', 'оцінок')} поза [0; 1] обрізано`,
          goalId: goal.id,
        })
      }
    })
  }

  if (project.alternatives.length >= 2 && analysis.ranking.length === 0) {
    issues.push({
      id: 'security-none',
      level: 'warning',
      route: 'params',
      message: `Жодна альтернатива не проходить поріг B${project.minSecurityLevel}`,
    })
  }

  return issues
}

export function issuesForRoute(issues: Issue[], route: RouteId): Issue[] {
  return issues.filter((issue) => issue.route === route)
}
