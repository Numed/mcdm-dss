import { toast } from 'sonner'
import type { PasteSummary } from '@/store/projectStore'
import { useProjectStore } from '@/store/projectStore'
import { pluralUk } from '@/lib/utils'

function undoAction() {
  return { label: 'Скасувати', onClick: () => useProjectStore.getState().undo() }
}

export function notifyRemoved(kind: string, name: string): void {
  toast(`${kind} «${name}» видалено`, { action: undoAction() })
}

export function notifyPaste(summary: PasteSummary): void {
  if (summary.values + summary.names === 0) {
    toast.error('У буфері немає чисел для вставки')
    return
  }
  const parts = [`${summary.values} ${pluralUk(summary.values, 'значення', 'значення', 'значень')}`]
  if (summary.names > 0) parts.push(`${summary.names} ${pluralUk(summary.names, 'назва', 'назви', 'назв')}`)
  if (summary.created > 0) parts.push(`${summary.created} ${pluralUk(summary.created, 'новий критерій', 'нові критерії', 'нових критеріїв')}`)
  toast.success(`Вставлено: ${parts.join(', ')}`, {
    description: summary.skipped > 0 ? `Пропущено нечислових комірок: ${summary.skipped}` : undefined,
    action: undoAction(),
  })
}
