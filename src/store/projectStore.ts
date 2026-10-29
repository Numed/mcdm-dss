import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { GoalNormalization } from '@/core/goals'
import type { PowerMeanOrder } from '@/core/matrixMethod'
import type { Criterion, CriteriaGroup, Goal, InputMode, Project } from '@/core/model'
import { bankDemo, createId } from '@/core/presets'
import type { SecurityLevel } from '@/core/security'
import { safeStorage } from './storage'

type CriterionPatch = Partial<Pick<Criterion, 'name' | 'direction'>>

type ProjectActions = {
  loadProject: (project: Project) => void
  setTitle: (title: string) => void
  addAlternative: () => void
  renameAlternative: (id: string, name: string) => void
  removeAlternative: (id: string) => void
  setInputMode: (mode: InputMode) => void
  setPowerMeanOrder: (order: PowerMeanOrder) => void
  setGoalNormalization: (normalization: GoalNormalization) => void
  setMinSecurityLevel: (level: SecurityLevel) => void
  addGoal: () => void
  renameGoal: (goalId: string, name: string) => void
  removeGoal: (goalId: string) => void
  setSatisfactionTerm: (goalId: string, term: number) => void
  setDirectScore: (goalId: string, alternativeId: string, value: number) => void
  addGroup: (goalId: string) => void
  renameGroup: (goalId: string, groupId: string, name: string) => void
  removeGroup: (goalId: string, groupId: string) => void
  addCriterion: (goalId: string, groupId: string) => void
  updateCriterion: (goalId: string, groupId: string, criterionId: string, patch: CriterionPatch) => void
  setCriterionValue: (goalId: string, groupId: string, criterionId: string, alternativeId: string, value: number) => void
  removeCriterion: (goalId: string, groupId: string, criterionId: string) => void
}

type ProjectState = {
  project: Project
} & ProjectActions

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

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      project: bankDemo(),
      loadProject: (project) => set({ project }),
      setTitle: (title) => set((state) => ({ project: { ...state.project, title } })),
      addAlternative: () =>
        set((state) => {
          const id = createId('alt')
          const project = state.project
          return {
            project: {
              ...project,
              alternatives: [...project.alternatives, { id, name: `Альтернатива ${project.alternatives.length + 1}` }],
              goals: project.goals.map((goal) => ({
                ...goal,
                directScores: { ...goal.directScores, [id]: 0.5 },
                groups: goal.groups.map((group) => ({
                  ...group,
                  criteria: group.criteria.map((criterion) => ({ ...criterion, values: { ...criterion.values, [id]: 1 } })),
                })),
              })),
            },
          }
        }),
      renameAlternative: (id, name) =>
        set((state) => ({
          project: {
            ...state.project,
            alternatives: state.project.alternatives.map((alt) => (alt.id === id ? { ...alt, name } : alt)),
          },
        })),
      removeAlternative: (id) =>
        set((state) => {
          const project = state.project
          return {
            project: {
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
            },
          }
        }),
      setInputMode: (inputMode) => set((state) => ({ project: { ...state.project, inputMode } })),
      setPowerMeanOrder: (powerMeanOrder) => set((state) => ({ project: { ...state.project, powerMeanOrder } })),
      setGoalNormalization: (goalNormalization) => set((state) => ({ project: { ...state.project, goalNormalization } })),
      setMinSecurityLevel: (minSecurityLevel) => set((state) => ({ project: { ...state.project, minSecurityLevel } })),
      addGoal: () =>
        set((state) => {
          const project = state.project
          const directScores: Record<string, number> = {}
          project.alternatives.forEach((alt) => {
            directScores[alt.id] = 0.5
          })
          const goal: Goal = {
            id: createId('goal'),
            name: `Ціль ${project.goals.length + 1}`,
            satisfactionTerm: 3,
            groups: [newGroup(project, 1)],
            directScores,
          }
          return { project: { ...project, goals: [...project.goals, goal] } }
        }),
      renameGoal: (goalId, name) => set((state) => ({ project: mapGoal(state.project, goalId, (goal) => ({ ...goal, name })) })),
      removeGoal: (goalId) =>
        set((state) => ({ project: { ...state.project, goals: state.project.goals.filter((goal) => goal.id !== goalId) } })),
      setSatisfactionTerm: (goalId, satisfactionTerm) =>
        set((state) => ({ project: mapGoal(state.project, goalId, (goal) => ({ ...goal, satisfactionTerm })) })),
      setDirectScore: (goalId, alternativeId, value) =>
        set((state) => ({
          project: mapGoal(state.project, goalId, (goal) => ({
            ...goal,
            directScores: { ...goal.directScores, [alternativeId]: value },
          })),
        })),
      addGroup: (goalId) =>
        set((state) => ({
          project: mapGoal(state.project, goalId, (goal) => ({
            ...goal,
            groups: [...goal.groups, newGroup(state.project, goal.groups.length + 1)],
          })),
        })),
      renameGroup: (goalId, groupId, name) =>
        set((state) => ({ project: mapGroup(state.project, goalId, groupId, (group) => ({ ...group, name })) })),
      removeGroup: (goalId, groupId) =>
        set((state) => ({
          project: mapGoal(state.project, goalId, (goal) => ({
            ...goal,
            groups: goal.groups.filter((group) => group.id !== groupId),
          })),
        })),
      addCriterion: (goalId, groupId) =>
        set((state) => ({
          project: mapGroup(state.project, goalId, groupId, (group) => ({
            ...group,
            criteria: [...group.criteria, newCriterion(state.project, group.criteria.length + 1)],
          })),
        })),
      updateCriterion: (goalId, groupId, criterionId, patch) =>
        set((state) => ({
          project: mapCriterion(state.project, goalId, groupId, criterionId, (criterion) => ({ ...criterion, ...patch })),
        })),
      setCriterionValue: (goalId, groupId, criterionId, alternativeId, value) =>
        set((state) => ({
          project: mapCriterion(state.project, goalId, groupId, criterionId, (criterion) => ({
            ...criterion,
            values: { ...criterion.values, [alternativeId]: value },
          })),
        })),
      removeCriterion: (goalId, groupId, criterionId) =>
        set((state) => ({
          project: mapGroup(state.project, goalId, groupId, (group) => ({
            ...group,
            criteria: group.criteria.filter((criterion) => criterion.id !== criterionId),
          })),
        })),
    }),
    {
      name: 'mcdm-goal-groups-project',
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({ project: state.project }),
    },
  ),
)
