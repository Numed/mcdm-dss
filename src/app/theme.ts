import { useEffect, useSyncExternalStore } from 'react'
import { type ThemePreference, useUiStore } from '@/store/uiStore'

export type ResolvedTheme = 'light' | 'dark' | 'black'

const DARK_QUERY = '(prefers-color-scheme: dark)'

function subscribeSystem(callback: () => void): () => void {
  const media = window.matchMedia(DARK_QUERY)
  media.addEventListener('change', callback)
  return () => media.removeEventListener('change', callback)
}

function systemPrefersDark(): boolean {
  return window.matchMedia(DARK_QUERY).matches
}

export function resolveTheme(preference: ThemePreference, systemDark: boolean): ResolvedTheme {
  if (preference === 'system') return systemDark ? 'dark' : 'light'
  return preference
}

export function useResolvedTheme(): ResolvedTheme {
  const preference = useUiStore((state) => state.theme)
  const systemDark = useSyncExternalStore(subscribeSystem, systemPrefersDark, () => false)
  return resolveTheme(preference, systemDark)
}

export function useApplyTheme(forceLight: boolean): void {
  const resolved = useResolvedTheme()
  const effective = forceLight ? 'light' : resolved
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', effective !== 'light')
    root.classList.toggle('black', effective === 'black')
  }, [effective])
}
