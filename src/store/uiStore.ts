import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { TemplateId } from '@/app/templates'
import { safeStorage } from './storage'

export type ThemePreference = 'light' | 'dark' | 'black' | 'system'

export type GoalTreeSelection =
  | { kind: 'goal'; goalId: string }
  | { kind: 'group'; goalId: string; groupId: string }

type UiState = {
  theme: ThemePreference
  sidebarExpanded: boolean
  pendingTemplate: TemplateId | null
  treeSelection: GoalTreeSelection | null
  detailGroup: string | null
  robustnessNoise: number
  setTheme: (theme: ThemePreference) => void
  setSidebarExpanded: (expanded: boolean) => void
  requestTemplate: (template: TemplateId | null) => void
  selectTree: (selection: GoalTreeSelection | null) => void
  setDetailGroup: (groupKey: string | null) => void
  setRobustnessNoise: (noise: number) => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      theme: 'system',
      sidebarExpanded: true,
      pendingTemplate: null,
      treeSelection: null,
      detailGroup: null,
      robustnessNoise: 0.1,
      setTheme: (theme) => set({ theme }),
      setSidebarExpanded: (sidebarExpanded) => set({ sidebarExpanded }),
      requestTemplate: (pendingTemplate) => set({ pendingTemplate }),
      selectTree: (treeSelection) => set({ treeSelection }),
      setDetailGroup: (detailGroup) => set({ detailGroup }),
      setRobustnessNoise: (robustnessNoise) => set({ robustnessNoise }),
    }),
    {
      name: 'mcdm-goal-groups-ui',
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({ theme: state.theme, sidebarExpanded: state.sidebarExpanded }),
    },
  ),
)
