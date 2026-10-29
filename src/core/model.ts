import type { CriterionDirection } from './normalization'
import type { GoalNormalization } from './goals'
import type { PowerMeanOrder } from './matrixMethod'
import type { SecurityLevel } from './security'

export type Alternative = {
  id: string
  name: string
}

export type Criterion = {
  id: string
  name: string
  direction: CriterionDirection
  values: Record<string, number>
}

export type CriteriaGroup = {
  id: string
  name: string
  criteria: Criterion[]
}

export type Goal = {
  id: string
  name: string
  groups: CriteriaGroup[]
  satisfactionTerm: number
  directScores: Record<string, number>
}

export type InputMode = 'criteria' | 'direct'

export type Project = {
  title: string
  alternatives: Alternative[]
  goals: Goal[]
  inputMode: InputMode
  powerMeanOrder: PowerMeanOrder
  goalNormalization: GoalNormalization
  minSecurityLevel: SecurityLevel
}
