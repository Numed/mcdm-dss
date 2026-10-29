import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { GoalNormalization } from '@/core/goals'
import type { PowerMeanOrder } from '@/core/matrixMethod'
import type { Alternative, Criterion, CriteriaGroup, Goal, InputMode, Project } from '@/core/model'
import { bankDemo, createId } from '@/core/presets'
import type { SecurityLevel } from '@/core/security'
import { isProject } from '@/core/validate'
import { parseLocaleNumber } from '@/lib/parse'
import { safeStorage } from './storage'

export const ALTERNATIVE_COLOR_COUNT = 8
const HISTORY_LIMIT = 100
const COALESCE_MS = 1200

type CriterionPatch = Partial<Pick<Criterion, 'name' | 'direction'>>

export type PasteSummary = {
  values: number
  names: number
  created: number
  skipped: number
}

export type CellPatch = {
  criterionId: string
  alternativeId: string
  value: number
}

type ProjectActions = {
  loadProject: (project: Project) => void
  setTitle: (title: string) => void
  addAlternative: () => void
  renameAlternative: (id: string, name: string) => void
  removeAlternative: (id: string) => void
  moveAlternative: (fromIndex: number, toIndex: number) => void
  setAlternativeColor: (id: string, color: number) => void
  setInputMode: (mode: InputMode) => void
  setPowerMeanOrder: (order: PowerMeanOrder) => void
  setGoalNormalization: (normalization: GoalNormalization) => void
  setMinSecurityLevel: (level: SecurityLevel) => void
  addGoal: () => string
  renameGoal: (goalId: string, name: string) => void
  removeGoal: (goalId: string) => void
  setSatisfactionTerm: (goalId: string, term: number) => void
  setDirectScore: (goalId: string, alternativeId: string, value: number) => void
  addGroup: (goalId: string) => string
  renameGroup: (goalId: string, groupId: string, name: string) => void
  removeGroup: (goalId: string, groupId: string) => void
  addCriterion: (goalId: string, groupId: string) => string
  updateCriterion: (goalId: string, groupId: string, criterionId: string, patch: CriterionPatch) => void
  setCriterionValue: (goalId: string, groupId: string, criterionId: string, alternativeId: string, value: number) => void
  setCriterionValues: (goalId: string, groupId: string, cells: CellPatch[]) => void
  removeCriterion: (goalId: string, groupId: string, criterionId: string) => void
  pasteIntoGroup: (goalId: string, groupId: string, startRow: number, startCol: number, rows: string[][]) => PasteSummary
  pasteDirectScores: (startGoal: number, startAlternative: number, rows: string[][]) => PasteSummary
  undo: () => void
  redo: () => void
}

type ProjectState = {
  project: Project
  past: Project[]
  future: Project[]
} & ProjectActions

type HistoryCursor = {
  key: string | null
  time: number
}

const cursor: HistoryCursor = { key: null, time: 0 }

function commit(state: ProjectState, next: Project, key?: string): Partial<ProjectState> {
  const now = Date.now()
  const coalesce = key !== undefined && key === cursor.key && now - cursor.time < COALESCE_MS
  cursor.key = key ?? null
  cursor.time = now
  if (coalesce) return { project: next, future: [] }
  return { project: next, past: [...state.past, state.project].slice(-HISTORY_LIMIT), future: [] }
}

function resetCursor(): void {
  cursor.key = null
  cursor.time = 0
}

export function nextFreeColor(alternatives: Alternative[]): number {
  const used = new Set(alternatives.map((alternative) => alternative.color))
  for (let slot = 0; slot < ALTERNATIVE_COLOR_COUNT; slot++) {
    if (!used.has(slot)) return slot
  }
  return alternatives.length % ALTERNATIVE_COLOR_COUNT
}

export function withColors(project: Project): Project {
  if (project.alternatives.every((alternative) => alternative.color !== undefined)) return project
  return {
    ...project,
    alternatives: project.alternatives.map((alternative, index) => ({
      ...alternative,
      color: alternative.color ?? index % ALTERNATIVE_COLOR_COUNT,
    })),
  }
}

function mapGoal(project: Project, goalId: string, update: (goal: Goal) => Goal): Project {
  return { ...project, goals: project.goals.map((goal) => (goal.id === goalId ? update(goal) : goal)) }
}

function mapGroup(project: Project, goalId: string, groupId: string, update: (group: CriteriaGroup) => CriteriaGroup): Project {
  return mapGoal(project, goalId, (goal) => ({
    ...goal,
    groups: goal.groups.map((group) => (group.id === groupId ? update(group) : group)),
  }))
}

function mapCriterion(
  project: Project,
  goalId: string,
  groupId: string,
  criterionId: string,
  update: (criterion: Criterion) => Criterion,
): Project {
  return mapGroup(project, goalId, groupId, (group) => ({
    ...group,
    criteria: group.criteria.map((criterion) => (criterion.id === criterionId ? update(criterion) : criterion)),
  }))
}

function newCriterion(project: Project, index: number): Criterion {
  const values: Record<string, number> = {}
  project.alternatives.forEach((alternative) => {
    values[alternative.id] = 1
  })
  return { id: createId('crit'), name: `Критерій ${index}`, direction: 'benefit', values }
}

function newGroup(project: Project, index: number): CriteriaGroup {
  return { id: createId('group'), name: `Група критеріїв ${index}`, criteria: [newCriterion(project, 1)] }
}

function withoutKey(record: Record<string, number>, key: string): Record<string, number> {
  const copy = { ...record }
  delete copy[key]
  return copy
}

function moveItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  const copy = [...items]
  const [moved] = copy.splice(fromIndex, 1)
  if (moved === undefined) return items
  copy.splice(toIndex, 0, moved)
  return copy
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      project: withColors(bankDemo()),
      past: [],
      future: [],
      loadProject: (project) =>
        set((state) => {
          resetCursor()
          return commit(state, withColors(project))
        }),
      setTitle: (title) => set((state) => commit(state, { ...state.project, title }, 'title')),
      addAlternative: () =>
        set((state) => {
          const id = createId('alt')
          const project = withColors(state.project)
          const alternative: Alternative = {
            id,
            name: `Альтернатива ${project.alternatives.length + 1}`,
            color: nextFreeColor(project.alternatives),
          }
          return commit(state, {
            ...project,
            alternatives: [...project.alternatives, alternative],
            goals: project.goals.map((goal) => ({
              ...goal,
              directScores: { ...goal.directScores, [id]: 0.5 },
              groups: goal.groups.map((group) => ({
                ...group,
                criteria: group.criteria.map((criterion) => ({ ...criterion, values: { ...criterion.values, [id]: 1 } })),
              })),
            })),
          })
        }),
      renameAlternative: (id, name) =>
        set((state) =>
          commit(
            state,
            {
              ...state.project,
              alternatives: state.project.alternatives.map((alt) => (alt.id === id ? { ...alt, name } : alt)),
            },
            `renameAlternative:${id}`,
          ),
        ),
      removeAlternative: (id) =>
        set((state) => {
          const project = state.project
          return commit(state, {
            ...project,
            alternatives: project.alternatives.filter((alt) => alt.id !== id),
            goals: project.goals.map((goal) => ({
              ...goal,
              directScores: withoutKey(goal.directScores, id),
              groups: goal.groups.map((group) => ({
                ...group,
                criteria: group.criteria.map((criterion) => ({ ...criterion, values: withoutKey(criterion.values, id) })),
              })),
            })),
          })
        }),
      moveAlternative: (fromIndex, toIndex) =>
        set((state) => {
          const project = withColors(state.project)
          if (fromIndex === toIndex) return {}
          return commit(state, { ...project, alternatives: moveItem(project.alternatives, fromIndex, toIndex) })
        }),
      setAlternativeColor: (id, color) =>
        set((state) =>
          commit(state, {
            ...state.project,
            alternatives: state.project.alternatives.map((alt) => (alt.id === id ? { ...alt, color } : alt)),
          }),
        ),
      setInputMode: (inputMode) => set((state) => commit(state, { ...state.project, inputMode })),
      setPowerMeanOrder: (powerMeanOrder) => set((state) => commit(state, { ...state.project, powerMeanOrder })),
      setGoalNormalization: (goalNormalization) => set((state) => commit(state, { ...state.project, goalNormalization })),
      setMinSecurityLevel: (minSecurityLevel) => set((state) => commit(state, { ...state.project, minSecurityLevel })),
      addGoal: () => {
        const id = createId('goal')
        set((state) => {
          const project = state.project
          const directScores: Record<string, number> = {}
          project.alternatives.forEach((alt) => {
            directScores[alt.id] = 0.5
          })
          const goal: Goal = {
            id,
            name: `Ціль ${project.goals.length + 1}`,
            satisfactionTerm: 3,
            groups: [newGroup(project, 1)],
            directScores,
          }
          return commit(state, { ...project, goals: [...project.goals, goal] })
        })
        return id
      },
      renameGoal: (goalId, name) =>
        set((state) => commit(state, mapGoal(state.project, goalId, (goal) => ({ ...goal, name })), `renameGoal:${goalId}`)),
      removeGoal: (goalId) =>
        set((state) => commit(state, { ...state.project, goals: state.project.goals.filter((goal) => goal.id !== goalId) })),
      setSatisfactionTerm: (goalId, satisfactionTerm) =>
        set((state) =>
          commit(state, mapGoal(state.project, goalId, (goal) => ({ ...goal, satisfactionTerm })), `term:${goalId}`),
        ),
      setDirectScore: (goalId, alternativeId, value) =>
        set((state) =>
          commit(
            state,
            mapGoal(state.project, goalId, (goal) => ({
              ...goal,
              directScores: { ...goal.directScores, [alternativeId]: value },
            })),
            `direct:${goalId}:${alternativeId}`,
          ),
        ),
      addGroup: (goalId) => {
        const group = newGroup(get().project, 1)
        set((state) =>
          commit(
            state,
            mapGoal(state.project, goalId, (goal) => ({
              ...goal,
              groups: [...goal.groups, { ...group, name: `Група критеріїв ${goal.groups.length + 1}` }],
            })),
          ),
        )
        return group.id
      },
      renameGroup: (goalId, groupId, name) =>
        set((state) =>
          commit(state, mapGroup(state.project, goalId, groupId, (group) => ({ ...group, name })), `renameGroup:${groupId}`),
        ),
      removeGroup: (goalId, groupId) =>
        set((state) =>
          commit(
            state,
            mapGoal(state.project, goalId, (goal) => ({
              ...goal,
              groups: goal.groups.filter((group) => group.id !== groupId),
            })),
          ),
        ),
      addCriterion: (goalId, groupId) => {
        const criterion = newCriterion(get().project, 1)
        set((state) =>
          commit(
            state,
            mapGroup(state.project, goalId, groupId, (group) => ({
              ...group,
              criteria: [...group.criteria, { ...criterion, name: `Критерій ${group.criteria.length + 1}` }],
            })),
          ),
        )
        return criterion.id
      },
      updateCriterion: (goalId, groupId, criterionId, patch) =>
        set((state) =>
          commit(
            state,
            mapCriterion(state.project, goalId, groupId, criterionId, (criterion) => ({ ...criterion, ...patch })),
            patch.name === undefined ? undefined : `renameCriterion:${criterionId}`,
          ),
        ),
      setCriterionValue: (goalId, groupId, criterionId, alternativeId, value) =>
        set((state) =>
          commit(
            state,
            mapCriterion(state.project, goalId, groupId, criterionId, (criterion) => ({
              ...criterion,
              values: { ...criterion.values, [alternativeId]: value },
            })),
            `value:${criterionId}:${alternativeId}`,
          ),
        ),
      setCriterionValues: (goalId, groupId, cells) =>
        set((state) =>
          commit(
            state,
            mapGroup(state.project, goalId, groupId, (group) => ({
              ...group,
              criteria: group.criteria.map((criterion) => {
                const patches = cells.filter((cell) => cell.criterionId === criterion.id)
                if (patches.length === 0) return criterion
                const values = { ...criterion.values }
                patches.forEach((cell) => {
                  values[cell.alternativeId] = cell.value
                })
                return { ...criterion, values }
              }),
            })),
          ),
        ),
      removeCriterion: (goalId, groupId, criterionId) =>
        set((state) =>
          commit(
            state,
            mapGroup(state.project, goalId, groupId, (group) => ({
              ...group,
              criteria: group.criteria.filter((criterion) => criterion.id !== criterionId),
            })),
          ),
        ),
      pasteIntoGroup: (goalId, groupId, startRow, startCol, rows) => {
        const summary: PasteSummary = { values: 0, names: 0, created: 0, skipped: 0 }
        set((state) => {
          const project = state.project
          const alternatives = project.alternatives
          const next = mapGroup(project, goalId, groupId, (group) => {
            const criteria = [...group.criteria]
            rows.forEach((cells, rowOffset) => {
              const rowIndex = startRow + rowOffset
              let criterion = criteria[rowIndex]
              if (!criterion) {
                criterion = { ...newCriterion(project, rowIndex + 1), name: `Критерій ${rowIndex + 1}` }
                summary.created += 1
              }
              const values = { ...criterion.values }
              let name = criterion.name
              cells.forEach((raw, cellOffset) => {
                const column = startCol + cellOffset
                if (column === 0) {
                  if (raw.trim() !== '') {
                    name = raw.trim()
                    summary.names += 1
                  }
                  return
                }
                const alternative = alternatives[column - 1]
                if (!alternative) return
                const value = parseLocaleNumber(raw)
                if (value === null) {
                  summary.skipped += 1
                  return
                }
                values[alternative.id] = value
                summary.values += 1
              })
              criteria[rowIndex] = { ...criterion, name, values }
            })
            return { ...group, criteria }
          })
          resetCursor()
          return commit(state, next)
        })
        return summary
      },
      pasteDirectScores: (startGoal, startAlternative, rows) => {
        const summary: PasteSummary = { values: 0, names: 0, created: 0, skipped: 0 }
        set((state) => {
          const project = state.project
          const goals = project.goals.map((goal, goalIndex) => {
            const cells = rows[goalIndex - startGoal]
            if (!cells) return goal
            const directScores = { ...goal.directScores }
            cells.forEach((raw, offset) => {
              const alternative = project.alternatives[startAlternative + offset]
              if (!alternative) return
              const value = parseLocaleNumber(raw)
              if (value === null) {
                summary.skipped += 1
                return
              }
              directScores[alternative.id] = Math.min(Math.max(value, 0), 1)
              summary.values += 1
            })
            return { ...goal, directScores }
          })
          resetCursor()
          return commit(state, { ...project, goals })
        })
        return summary
      },
      undo: () =>
        set((state) => {
          const previous = state.past[state.past.length - 1]
          if (!previous) return {}
          resetCursor()
          return { project: previous, past: state.past.slice(0, -1), future: [state.project, ...state.future] }
        }),
      redo: () =>
        set((state) => {
          const [next, ...rest] = state.future
          if (!next) return {}
          resetCursor()
          return { project: next, past: [...state.past, state.project], future: rest }
        }),
    }),
    {
      name: 'mcdm-goal-groups-project',
      version: 2,
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({ project: state.project }),
      migrate: (persisted) => {
        if (isPersistedProject(persisted)) return { project: withColors(persisted.project) }
        return { project: withColors(bankDemo()) }
      },
    },
  ),
)

type PersistedProject = {
  project: Project
}

function isPersistedProject(value: unknown): value is PersistedProject {
  return typeof value === 'object' && value !== null && 'project' in value && isProject(value.project)
}
