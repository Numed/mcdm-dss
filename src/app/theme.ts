import { useEffect, useSyncExternalStore } from 'react'
import { type ThemePreference, useUiStore } from '@/store/uiStore'

const DARK_QUERY = '(prefers-color-scheme: dark)'

function subscribeSystem(callback: () => void): () => void {
  const media = window.matchMedia(DARK_QUERY)
  media.addEventListener('change', callback)
  return () => media.removeEventListener('change', callback)
}

function systemPrefersDark(): boolean {
  return window.matchMedia(DARK_QUERY).matches
}

export function resolveTheme(preference: ThemePreference, systemDark: boolean): 'light' | 'dark' {
  if (preference === 'system') return systemDark ? 'dark' : 'light'
  return preference
}

export function useResolvedTheme(): 'light' | 'dark' {
  const preference = useUiStore((state) => state.theme)
  const systemDark = useSyncExternalStore(subscribeSystem, systemPrefersDark, () => false)
  return resolveTheme(preference, systemDark)
}

export function useApplyTheme(forceLight: boolean): void {
  const resolved = useResolvedTheme()
  const effective = forceLight ? 'light' : resolved
  useEffect(() => {
    document.documentElement.classList.toggle('dark', effective === 'dark')
  }, [effective])
}
