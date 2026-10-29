import { useEffect } from 'react'
import { useProjectStore } from '@/store/projectStore'

function isTextField(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'
}

export function useUndoShortcuts(): void {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.altKey) return
      if (isTextField(event.target)) return
      const key = event.key.toLowerCase()
      if (key === 'z' && !event.shiftKey) {
        event.preventDefault()
        useProjectStore.getState().undo()
      } else if ((key === 'z' && event.shiftKey) || key === 'y') {
        event.preventDefault()
        useProjectStore.getState().redo()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
}
