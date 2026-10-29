import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useProjectStore } from '@/store/projectStore'
import { useUiStore } from '@/store/uiStore'
import { navigate } from './routes'
import { templateById } from './templates'

export function ReplaceProjectDialog() {
  const pending = useUiStore((state) => state.pendingTemplate)
  const requestTemplate = useUiStore((state) => state.requestTemplate)
  const loadProject = useProjectStore((state) => state.loadProject)
  const currentTitle = useProjectStore((state) => state.project.title)
  const template = pending ? templateById(pending) : null

  const apply = () => {
    if (!template) return
    loadProject(template.create())
    requestTemplate(null)
    toast.success(`Завантажено шаблон «${template.title}»`, {
      action: { label: 'Скасувати', onClick: () => useProjectStore.getState().undo() },
    })
    if (template.id !== 'empty') navigate('results')
  }

  return (
    <AlertDialog open={template !== null} onOpenChange={(open) => !open && requestTemplate(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Замінити поточний проєкт?</AlertDialogTitle>
          <AlertDialogDescription>
            Проєкт «{currentTitle}» буде замінено шаблоном «{template?.title}». Цю дію можна скасувати одразу після
            заміни або комбінацією Ctrl+Z.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Залишити</AlertDialogCancel>
          <AlertDialogAction onClick={apply}>Замінити</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
