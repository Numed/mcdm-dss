import { toast } from 'sonner'
import { isProject } from '@/core/validate'
import { downloadText, fileSlug } from '@/lib/download'
import { useProjectStore } from '@/store/projectStore'

export function exportProjectJson(): void {
  const project = useProjectStore.getState().project
  downloadText(`${fileSlug(project.title)}.json`, JSON.stringify(project, null, 2), 'application/json')
  toast.success('Проєкт експортовано', { description: `${fileSlug(project.title)}.json` })
}

export async function importProjectFile(file: File): Promise<void> {
  let parsed: unknown
  try {
    parsed = JSON.parse(await file.text())
  } catch {
    toast.error('Не вдалося прочитати JSON', { description: file.name })
    return
  }
  if (!isProject(parsed)) {
    toast.error('Файл не схожий на проєкт цієї системи', { description: file.name })
    return
  }
  const store = useProjectStore.getState()
  store.loadProject(parsed)
  toast.success('Проєкт імпортовано', {
    description: parsed.title,
    action: { label: 'Скасувати', onClick: () => useProjectStore.getState().undo() },
  })
}

export function pickProjectFile(): void {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'application/json,.json'
  input.addEventListener('change', () => {
    const file = input.files?.[0]
    if (file) void importProjectFile(file)
  })
  input.click()
}
