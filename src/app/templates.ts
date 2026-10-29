import type { Project } from '@/core/model'
import { articleExample, bankDemo, emptyProject } from '@/core/presets'

export type TemplateId = 'bank' | 'article' | 'empty'

export type Template = {
  id: TemplateId
  title: string
  description: string
  create: () => Project
}

export const TEMPLATES: Template[] = [
  {
    id: 'bank',
    title: 'Демо: банки',
    description: '6 банків, 2 цілі, 4 групи і 10 кількісних показників',
    create: bankDemo,
  },
  {
    id: 'article',
    title: 'Приклад зі статті',
    description: '5 альтернатив з готовими оцінками за двома цілями, T = (0,4; 0,8)',
    create: articleExample,
  },
  {
    id: 'empty',
    title: 'Порожній проєкт',
    description: '3 альтернативи, 2 цілі по одному критерію',
    create: emptyProject,
  },
]

export function templateById(id: TemplateId): Template {
  return TEMPLATES.find((template) => template.id === id) ?? TEMPLATES[0]
}
