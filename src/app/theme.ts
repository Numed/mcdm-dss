import { useLayoutEffect, useMemo, useSyncExternalStore } from 'react'
import { resolveCssColor } from '@/lib/contrast'
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
  useLayoutEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', effective !== 'light')
    root.classList.toggle('black', effective === 'black')
  }, [effective])
}

function subscribeRootClass(callback: () => void): () => void {
  const observer = new MutationObserver(callback)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  return () => observer.disconnect()
}

const SEPARATOR = '|'

export function useResolvedCssColors(values: string[]): string[] {
  const key = values.join(SEPARATOR)
  const snapshot = useSyncExternalStore(
    subscribeRootClass,
    () => key.split(SEPARATOR).map(resolveCssColor).join(SEPARATOR),
    () => key,
  )
  return useMemo(() => snapshot.split(SEPARATOR), [snapshot])
}
