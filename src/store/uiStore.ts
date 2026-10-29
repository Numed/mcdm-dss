import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { TemplateId } from '@/app/templates'
import { safeStorage } from './storage'

export type ThemePreference = 'light' | 'dark' | 'system'

export type GoalTreeSelection =
  | { kind: 'goal'; goalId: string }
  | { kind: 'group'; goalId: string; groupId: string }

type UiState = {
  theme: ThemePreference
  sidebarExpanded: boolean
  pendingTemplate: TemplateId | null
  treeSelection: GoalTreeSelection | null
  detailGroup: string | null
  setTheme: (theme: ThemePreference) => void
  setSidebarExpanded: (expanded: boolean) => void
  requestTemplate: (template: TemplateId | null) => void
  selectTree: (selection: GoalTreeSelection | null) => void
  setDetailGroup: (groupKey: string | null) => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      theme: 'system',
      sidebarExpanded: true,
      pendingTemplate: null,
      treeSelection: null,
      detailGroup: null,
      setTheme: (theme) => set({ theme }),
      setSidebarExpanded: (sidebarExpanded) => set({ sidebarExpanded }),
      requestTemplate: (pendingTemplate) => set({ pendingTemplate }),
      selectTree: (treeSelection) => set({ treeSelection }),
      setDetailGroup: (detailGroup) => set({ detailGroup }),
    }),
    {
      name: 'mcdm-goal-groups-ui',
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({ theme: state.theme, sidebarExpanded: state.sidebarExpanded }),
    },
  ),
)
