import { ChevronRight, Menu, MonitorPlay, PanelLeft, Redo2, Undo2 } from 'lucide-react'
import { InlineEdit } from '@/components/app/InlineEdit'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn, pluralUk } from '@/lib/utils'
import { useProjectStore } from '@/store/projectStore'
import { type RouteId, routeHref, routeMeta } from './routes'
import { useIssues } from './useAnalysis'
import { criteriaCount } from './validation'

type TopbarProps = {
  route: RouteId
  wide: boolean
  onToggleSidebar: () => void
}

function statusDotClass(errors: number, total: number): string {
  if (errors > 0) return 'bg-destructive'
  if (total > 0) return 'bg-warning'
  return 'bg-success'
}

function StatusIndicator() {
  const project = useProjectStore((state) => state.project)
  const issues = useIssues()
  const errors = issues.filter((issue) => issue.level === 'error')
  const alternatives = project.alternatives.length
  const goals = project.goals.length
  const criteria = criteriaCount(project)
  const parts = [
    `${alternatives} ${pluralUk(alternatives, 'альтернатива', 'альтернативи', 'альтернатив')}`,
    `${goals} ${pluralUk(goals, 'ціль', 'цілі', 'цілей')}`,
    project.inputMode === 'criteria'
      ? `${criteria} ${pluralUk(criteria, 'критерій', 'критерії', 'критеріїв')}`
      : 'готові оцінки',
  ]
  const hasErrors = errors.length > 0
  const firstIssue = issues[0]

  return (
    <a
      href={firstIssue ? routeHref(firstIssue.route) : routeHref('results')}
      title={issues.map((issue) => issue.message).join('\n') || 'Результати оновлюються автоматично після кожної зміни'}
      className="hidden h-7 items-center gap-2 rounded-full border bg-card px-3 text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 md:flex"
    >
      <span className="relative flex size-2">
        <span className={cn('absolute inline-flex size-full rounded-full', statusDotClass(errors.length, issues.length))} />
      </span>
      <span className="font-medium text-foreground">{hasErrors ? 'Потребує уваги' : 'Розраховано'}</span>
      <span className="hidden lg:inline">· {parts.join(' · ')}</span>
      {issues.length > 0 && (
        <span className="num">
          · {issues.length} {pluralUk(issues.length, 'зауваження', 'зауваження', 'зауважень')}
        </span>
      )}
    </a>
  )
}

export function Topbar(props: TopbarProps) {
  const { route, wide, onToggleSidebar } = props
  const title = useProjectStore((state) => state.project.title)
  const setTitle = useProjectStore((state) => state.setTitle)
  const canUndo = useProjectStore((state) => state.past.length > 0)
  const canRedo = useProjectStore((state) => state.future.length > 0)
  const undo = useProjectStore((state) => state.undo)
  const redo = useProjectStore((state) => state.redo)
  const meta = routeMeta(route)

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/85 px-4 backdrop-blur-md supports-[backdrop-filter]:bg-background/70 print:hidden">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onToggleSidebar}
        aria-label={wide ? 'Згорнути або розгорнути бічну панель' : 'Відкрити меню'}
      >
        {wide ? <PanelLeft /> : <Menu />}
      </Button>
      <div className="mx-1 hidden h-5 w-px bg-border sm:block" />
      <nav aria-label="Хлібні крихти" className="flex min-w-0 flex-1 items-center gap-1 text-[13px]">
        <InlineEdit
          value={title}
          onChange={setTitle}
          ariaLabel="Назва проєкту"
          placeholder="Без назви"
          className="hidden max-w-[22rem] text-muted-foreground sm:flex"
        />
        <ChevronRight className="hidden size-3.5 shrink-0 text-muted-foreground/60 sm:block" aria-hidden />
        <span className="hidden shrink-0 text-muted-foreground lg:inline">{meta.section}</span>
        <ChevronRight className="hidden size-3.5 shrink-0 text-muted-foreground/60 lg:block" aria-hidden />
        <span className="truncate px-1 font-medium" aria-current="page">
          {meta.title}
        </span>
      </nav>
      <StatusIndicator />
      <Button asChild variant="outline" size="sm" className="hidden lg:inline-flex">
        <a href={routeHref('present')}>
          <MonitorPlay />
          Презентація
        </a>
      </Button>
      <div className="flex items-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" disabled={!canUndo} onClick={undo} aria-label="Скасувати">
              <Undo2 />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Скасувати · Ctrl+Z</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" disabled={!canRedo} onClick={redo} aria-label="Повторити">
              <Redo2 />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Повторити · Ctrl+Shift+Z</TooltipContent>
        </Tooltip>
      </div>
    </header>
  )
}
