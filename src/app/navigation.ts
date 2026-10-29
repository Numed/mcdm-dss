import {
  Activity,
  BookOpen,
  FileText,
  GitCompareArrows,
  LayoutDashboard,
  ListTree,
  type LucideIcon,
  Rows3,
  SlidersHorizontal,
  Trophy,
} from 'lucide-react'
import type { RouteId } from './routes'

export type NavItem = {
  id: RouteId
  title: string
  icon: LucideIcon
}

export type NavSection = {
  title: string
  items: NavItem[]
}

export const NAV_SECTIONS: NavSection[] = [
  { title: 'Проєкт', items: [{ id: 'overview', title: 'Огляд', icon: LayoutDashboard }] },
  {
    title: 'Вхідні дані',
    items: [
      { id: 'alternatives', title: 'Альтернативи', icon: Rows3 },
      { id: 'goals', title: 'Цілі та критерії', icon: ListTree },
      { id: 'params', title: 'Параметри', icon: SlidersHorizontal },
    ],
  },
  {
    title: 'Аналіз',
    items: [
      { id: 'results', title: 'Результати', icon: Trophy },
      { id: 'sensitivity', title: 'Аналіз чутливості', icon: Activity },
      { id: 'compare', title: 'Порівняння методів', icon: GitCompareArrows },
    ],
  },
  {
    title: 'Довідка',
    items: [
      { id: 'method', title: 'Про метод', icon: BookOpen },
      { id: 'report', title: 'Звіт для друку', icon: FileText },
    ],
  },
]
