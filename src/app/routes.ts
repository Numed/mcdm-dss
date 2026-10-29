import { useSyncExternalStore } from 'react'

export type RouteId =
  | 'overview'
  | 'alternatives'
  | 'goals'
  | 'params'
  | 'results'
  | 'sensitivity'
  | 'compare'
  | 'method'
  | 'report'
  | 'present'

export type RouteMeta = {
  id: RouteId
  title: string
  section: string
}

export const ROUTES: RouteMeta[] = [
  { id: 'overview', title: 'Огляд', section: 'Проєкт' },
  { id: 'alternatives', title: 'Альтернативи', section: 'Вхідні дані' },
  { id: 'goals', title: 'Цілі та критерії', section: 'Вхідні дані' },
  { id: 'params', title: 'Параметри', section: 'Вхідні дані' },
  { id: 'results', title: 'Результати', section: 'Аналіз' },
  { id: 'sensitivity', title: 'Аналіз чутливості', section: 'Аналіз' },
  { id: 'compare', title: 'Порівняння методів', section: 'Аналіз' },
  { id: 'method', title: 'Про метод', section: 'Довідка' },
  { id: 'report', title: 'Звіт', section: 'Експорт' },
  { id: 'present', title: 'Презентація', section: 'Довідка' },
]

const DEFAULT_ROUTE: RouteId = 'overview'

function isRouteId(value: string): value is RouteId {
  return ROUTES.some((route) => route.id === value)
}

function readRoute(): RouteId {
  const [hash = ''] = window.location.hash.replace(/^#\/?/, '').split('/')
  return isRouteId(hash) ? hash : DEFAULT_ROUTE
}

export function readRouteParam(): string | null {
  const [, param] = window.location.hash.replace(/^#\/?/, '').split('/')
  return param ?? null
}

function subscribe(callback: () => void): () => void {
  window.addEventListener('hashchange', callback)
  return () => window.removeEventListener('hashchange', callback)
}

export function useRoute(): RouteId {
  return useSyncExternalStore(subscribe, readRoute, () => DEFAULT_ROUTE)
}

export function routeHref(id: RouteId): string {
  return `#${id}`
}

export function navigate(id: RouteId): void {
  window.location.hash = id
}

export function routeMeta(id: RouteId): RouteMeta {
  return ROUTES.find((route) => route.id === id) ?? ROUTES[0]
}
