import { Circle, Download, FileJson, FileSpreadsheet, FileText, FolderOpen, Monitor, Moon, Sun, Upload } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useProjectStore } from '@/store/projectStore'
import { type ThemePreference, useUiStore } from '@/store/uiStore'
import { exportResultsCsv, exportResultsXlsx } from './exportResults'
import { NAV_SECTIONS, type NavItem } from './navigation'
import { exportProjectJson, pickProjectFile } from './projectFile'
import { type RouteId, routeHref } from './routes'
import { TEMPLATES } from './templates'
import { useIssues } from './useAnalysis'
import { issuesForRoute } from './validation'

type AppSidebarProps = {
  route: RouteId
  collapsed: boolean
  onNavigate?: () => void
}

type NavLinkProps = {
  item: NavItem
  active: boolean
  collapsed: boolean
  status: 'error' | 'warning' | null
  onNavigate?: () => void
}

type ThemeOption = {
  value: ThemePreference
  label: string
  icon: typeof Sun
  iconClassName?: string
}

type CollapsibleTooltipProps = {
  label: string
  collapsed: boolean
  children: ReactNode
}

const THEME_OPTIONS: ThemeOption[] = [
  { value: 'light', label: 'Світла тема', icon: Sun },
  { value: 'system', label: 'Як у системі', icon: Monitor },
  { value: 'dark', label: 'Темна тема', icon: Moon },
  { value: 'black', label: 'Чорна тема', icon: Circle, iconClassName: 'fill-current' },
]

function CollapsibleTooltip(props: CollapsibleTooltipProps) {
  const { label, collapsed, children } = props
  if (!collapsed) return children
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  )
}

function statusColor(status: 'error' | 'warning'): string {
  if (status === 'error') return 'bg-destructive'
  return 'bg-warning'
}

function NavLink(props: NavLinkProps) {
  const { item, active, collapsed, status, onNavigate } = props
  const Icon = item.icon
  return (
    <CollapsibleTooltip label={item.title} collapsed={collapsed}>
      <a
        href={routeHref(item.id)}
        onClick={onNavigate}
        aria-current={active ? 'page' : undefined}
        aria-label={collapsed ? item.title : undefined}
        className={cn(
          'group relative flex h-8 items-center gap-2.5 rounded-md px-2 text-[13px] font-medium text-muted-foreground outline-none transition-colors',
          'hover:bg-sidebar-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50',
          active && 'bg-sidebar-accent text-foreground',
          collapsed && 'justify-center px-0',
        )}
      >
        <Icon className={cn('size-4 shrink-0', active && 'text-primary')} aria-hidden />
        {!collapsed && <span className="truncate">{item.title}</span>}
        {status && (
          <span
            className={cn(
              'size-1.5 rounded-full',
              statusColor(status),
              collapsed ? 'absolute top-1.5 right-1.5' : 'ml-auto',
            )}
            aria-label={status === 'error' ? 'Є помилки' : 'Є попередження'}
          />
        )}
      </a>
    </CollapsibleTooltip>
  )
}

function routeStatus(levels: ('error' | 'warning')[]): 'error' | 'warning' | null {
  if (levels.includes('error')) return 'error'
  if (levels.includes('warning')) return 'warning'
  return null
}

export function AppSidebar(props: AppSidebarProps) {
  const { route, collapsed, onNavigate } = props
  const issues = useIssues()
  const title = useProjectStore((state) => state.project.title)
  const theme = useUiStore((state) => state.theme)
  const setTheme = useUiStore((state) => state.setTheme)
  const requestTemplate = useUiStore((state) => state.requestTemplate)

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className={cn('flex h-14 shrink-0 items-center gap-2.5 border-b border-sidebar-border px-4', collapsed && 'justify-center px-0')}>
        <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-[11px] font-bold tracking-tight text-primary-foreground">
          G
        </div>
        {!collapsed && (
          <div className="min-w-0 leading-tight">
            <div className="truncate text-[13px] font-semibold">СППР · Групи цілей</div>
            <div className="truncate text-[11px] text-muted-foreground">Багатокритеріальний вибір</div>
          </div>
        )}
      </div>

      <nav aria-label="Розділи" className={cn('flex-1 overflow-y-auto px-3 py-3', collapsed && 'px-2')}>
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="mb-4 last:mb-0">
            {!collapsed && <div className="mb-1 px-2 text-[11px] font-medium text-muted-foreground/80">{section.title}</div>}
            {collapsed && <div className="mx-auto mb-2 h-px w-6 bg-sidebar-border first:hidden" />}
            <div className="flex flex-col gap-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.id}
                  item={item}
                  active={route === item.id}
                  collapsed={collapsed}
                  status={routeStatus(issuesForRoute(issues, item.id).map((issue) => issue.level))}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className={cn('flex shrink-0 flex-col gap-2 border-t border-sidebar-border p-3', collapsed && 'items-center px-2')}>
        {!collapsed && (
          <div className="rounded-lg border border-sidebar-border bg-card px-3 py-2">
            <div className="eyebrow !text-[10px]">Поточний проєкт</div>
            <div className="mt-0.5 line-clamp-2 text-[12px] leading-4 font-medium" title={title}>
              {title || 'Без назви'}
            </div>
          </div>
        )}

        <div className={cn('flex items-center gap-1', collapsed && 'flex-col')}>
          <DropdownMenu>
            <CollapsibleTooltip label="Відкрити" collapsed={collapsed}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size={collapsed ? 'icon-sm' : 'sm'} className={cn(!collapsed && 'flex-1 justify-start')} aria-label="Відкрити або імпортувати проєкт">
                  <FolderOpen />
                  {!collapsed && 'Відкрити'}
                </Button>
              </DropdownMenuTrigger>
            </CollapsibleTooltip>
            <DropdownMenuContent side={collapsed ? 'right' : 'top'} align="start" className="w-64">
              <DropdownMenuLabel>Шаблони</DropdownMenuLabel>
              {TEMPLATES.map((template) => (
                <DropdownMenuItem key={template.id} onSelect={() => requestTemplate(template.id)} className="flex-col items-start gap-0">
                  <span>{template.title}</span>
                  <span className="text-xs text-muted-foreground">{template.description}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={pickProjectFile}>
                <Upload />
                Імпорт з JSON…
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <CollapsibleTooltip label="Експорт" collapsed={collapsed}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size={collapsed ? 'icon-sm' : 'sm'} className={cn(!collapsed && 'flex-1 justify-start')} aria-label="Експорт">
                  <Download />
                  {!collapsed && 'Експорт'}
                </Button>
              </DropdownMenuTrigger>
            </CollapsibleTooltip>
            <DropdownMenuContent side={collapsed ? 'right' : 'top'} align="start" className="w-56">
              <DropdownMenuLabel>Проєкт</DropdownMenuLabel>
              <DropdownMenuItem onSelect={exportProjectJson}>
                <FileJson />
                Проєкт (JSON)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Результати</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => void exportResultsXlsx()}>
                <FileSpreadsheet />
                Excel (XLSX)
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={exportResultsCsv}>
                <FileSpreadsheet />
                CSV
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href={routeHref('report')} onClick={onNavigate}>
                  <FileText />
                  Звіт для друку / PDF
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div
          role="radiogroup"
          aria-label="Тема оформлення"
          className={cn('flex rounded-md border border-sidebar-border bg-card p-0.5', collapsed && 'flex-col')}
        >
          {THEME_OPTIONS.map((option) => {
            const Icon = option.icon
            const active = theme === option.value
            return (
              <CollapsibleTooltip key={option.value} label={option.label} collapsed={collapsed}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-label={option.label}
                  title={collapsed ? undefined : option.label}
                  onClick={() => setTheme(option.value)}
                  className={cn(
                    'flex h-7 flex-1 cursor-pointer items-center justify-center rounded-[5px] text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50',
                    collapsed && 'w-7 flex-none',
                    active && 'bg-accent text-foreground shadow-xs',
                  )}
                >
                  <Icon className={cn('size-3.5', option.iconClassName)} aria-hidden />
                </button>
              </CollapsibleTooltip>
            )
          })}
        </div>
      </div>
    </div>
  )
}
