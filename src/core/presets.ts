import type { Alternative, Criterion, CriteriaGroup, Goal, Project } from './model'
import type { CriterionDirection } from './normalization'

let counter = 0

export function createId(prefix: string): string {
  counter += 1
  const random = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID().slice(0, 8) : String(Date.now())
  return `${prefix}-${random}-${counter}`
}

type CriterionSeed = {
  name: string
  direction: CriterionDirection
  values: number[]
}

type GroupSeed = {
  name: string
  criteria: CriterionSeed[]
}

type GoalSeed = {
  name: string
  satisfactionTerm: number
  groups: GroupSeed[]
  directScores?: number[]
}

function buildAlternatives(names: string[]): Alternative[] {
  return names.map((name) => ({ id: createId('alt'), name }))
}

function buildCriterion(seed: CriterionSeed, alternatives: Alternative[]): Criterion {
  const values: Record<string, number> = {}
  alternatives.forEach((alternative, index) => {
    values[alternative.id] = seed.values[index] ?? 0
  })
  return { id: createId('crit'), name: seed.name, direction: seed.direction, values }
}

function buildGroup(seed: GroupSeed, alternatives: Alternative[]): CriteriaGroup {
  return {
    id: createId('group'),
    name: seed.name,
    criteria: seed.criteria.map((criterion) => buildCriterion(criterion, alternatives)),
  }
}

function buildGoal(seed: GoalSeed, alternatives: Alternative[]): Goal {
  const directScores: Record<string, number> = {}
  alternatives.forEach((alternative, index) => {
    directScores[alternative.id] = seed.directScores?.[index] ?? 0
  })
  return {
    id: createId('goal'),
    name: seed.name,
    satisfactionTerm: seed.satisfactionTerm,
    groups: seed.groups.map((group) => buildGroup(group, alternatives)),
    directScores,
  }
}

export function articleExample(): Project {
  const alternatives = buildAlternatives(['x1', 'x2', 'x3', 'x4', 'x5'])
  return {
    title: 'Приклад зі статті (вибір банку, готові оцінки за цілями)',
    alternatives,
    inputMode: 'direct',
    powerMeanOrder: 1,
    goalNormalization: 'max',
    minSecurityLevel: 1,
    goals: [
      buildGoal({ name: 'G1: отримання кредиту', satisfactionTerm: 2, groups: [], directScores: [0.8, 0.7, 0.9, 0.1, 0.8] }, alternatives),
      buildGoal({ name: 'G2: розміщення депозиту', satisfactionTerm: 4, groups: [], directScores: [0.9, 0.6, 1, 0.3, 0.2] }, alternatives),
    ],
  }
}

export function bankDemo(): Project {
  const alternatives = buildAlternatives(['Банк А', 'Банк Б', 'Банк В', 'Банк Г', 'Банк Д', 'Банк Е'])
  return {
    title: 'Демо: вибір банку суб’єктом господарювання',
    alternatives,
    inputMode: 'criteria',
    powerMeanOrder: 1,
    goalNormalization: 'max',
    minSecurityLevel: 2,
    goals: [
      buildGoal(
        {
          name: 'G1: отримання кредиту',
          satisfactionTerm: 2,
          groups: [
            {
              name: 'Активи і кредитний портфель',
              criteria: [
                { name: 'Загальні активи, млрд грн', direction: 'benefit', values: [412, 186, 95, 64, 238, 41] },
                { name: 'Кредитний портфель, млрд грн', direction: 'benefit', values: [168, 92, 51, 22, 117, 19] },
                { name: 'Частка проблемних кредитів, %', direction: 'cost', values: [9.4, 6.1, 4.8, 17.2, 11.5, 7.3] },
              ],
            },
            {
              name: 'Умови кредитування',
              criteria: [
                { name: 'Ставка за кредитом, %', direction: 'cost', values: [17.5, 16.2, 18.9, 22.4, 15.8, 19.6] },
                { name: 'Термін розгляду заявки, днів', direction: 'cost', values: [5, 3, 2, 7, 6, 4] },
              ],
            },
          ],
        },
        alternatives,
      ),
      buildGoal(
        {
          name: 'G2: розміщення депозиту',
          satisfactionTerm: 4,
          groups: [
            {
              name: 'Стійкість банку',
              criteria: [
                { name: 'Регулятивний капітал, млрд грн', direction: 'benefit', values: [58, 27, 14, 6, 31, 5] },
                { name: 'Адекватність капіталу Н2, %', direction: 'benefit', values: [21.3, 18.7, 24.1, 11.2, 16.4, 13.8] },
                { name: 'Миттєва ліквідність, %', direction: 'benefit', values: [74, 68, 81, 39, 59, 52] },
              ],
            },
            {
              name: 'Умови депозиту',
              criteria: [
                { name: 'Ставка за депозитом, %', direction: 'benefit', values: [12.5, 13.2, 14.1, 15.6, 12.9, 14.4] },
                { name: 'Мінімальна сума, тис. грн', direction: 'cost', values: [10, 5, 1, 1, 20, 3] },
              ],
            },
          ],
        },
        alternatives,
      ),
    ],
  }
}

export function emptyProject(): Project {
  const alternatives = buildAlternatives(['Альтернатива 1', 'Альтернатива 2', 'Альтернатива 3'])
  return {
    title: 'Новий проєкт',
    alternatives,
    inputMode: 'criteria',
    powerMeanOrder: 1,
    goalNormalization: 'max',
    minSecurityLevel: 1,
    goals: [
      buildGoal(
        {
          name: 'Ціль 1',
          satisfactionTerm: 3,
          groups: [{ name: 'Група критеріїв 1', criteria: [{ name: 'Критерій 1', direction: 'benefit', values: [1, 1, 1] }] }],
        },
        alternatives,
      ),
      buildGoal(
        {
          name: 'Ціль 2',
          satisfactionTerm: 3,
          groups: [{ name: 'Група критеріїв 1', criteria: [{ name: 'Критерій 1', direction: 'benefit', values: [1, 1, 1] }] }],
        },
        alternatives,
      ),
    ],
  }
}
