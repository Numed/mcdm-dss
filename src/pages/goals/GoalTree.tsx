import { ArrowDown, ArrowUp, ChevronRight, Plus } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import type { Issue } from '@/app/validation'
import { Button } from '@/components/ui/button'
import type { Goal } from '@/core/model'
import { cn, stripGoalPrefix } from '@/lib/utils'
import type { GoalTreeSelection } from '@/store/uiStore'

type GoalTreeProps = {
  goals: Goal[]
  selection: GoalTreeSelection
  issues: Issue[]
  showGroups: boolean
  onSelect: (selection: GoalTreeSelection) => void
  onSelectCriterion: (goalId: string, groupId: string, criterionIndex: number) => void
  onAddGoal: () => void
  onAddGroup: (goalId: string) => void
}

type TreeRowProps = {
  depth: number
  active: boolean
  label: string
  meta?: string
  marker?: 'error' | 'warning' | null
  expanded?: boolean
  onToggle?: () => void
  onClick: () => void
  prefix?: ReactNode
}

function markerFor(issues: Issue[]): 'error' | 'warning' | null {
  if (issues.some((issue) => issue.level === 'error')) return 'error'
  if (issues.length > 0) return 'warning'
  return null
}

function TreeRow(props: TreeRowProps) {
  const { depth, active, label, meta, marker, expanded, onToggle, onClick, prefix } = props
  return (
    <div
      className={cn(
        'group flex h-8 items-center gap-1 rounded-md pr-2 text-[13px] transition-colors',
        active ? 'bg-primary/10 text-foreground' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
      )}
      style={{ paddingLeft: depth * 16 + 4 }}
    >
      {onToggle ? (
        <button
          type="button"
          onClick={onToggle}
          aria-label={expanded ? 'Згорнути' : 'Розгорнути'}
          aria-expanded={expanded}
          className="flex size-5 shrink-0 cursor-pointer items-center justify-center rounded text-muted-foreground outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <ChevronRight className={cn('size-3.5 transition-transform', expanded && 'rotate-90')} aria-hidden />
        </button>
      ) : (
        <span className="size-5 shrink-0" />
      )}
      <button
        type="button"
        onClick={onClick}
        aria-current={active ? 'true' : undefined}
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        {prefix}
        <span className={cn('truncate', active && 'font-medium')}>{label}</span>
        {marker && (
          <span
            className={cn('size-1.5 shrink-0 rounded-full', marker === 'error' ? 'bg-destructive' : 'bg-warning')}
            aria-label={marker === 'error' ? 'Є помилки' : 'Є попередження'}
          />
        )}
        {meta && <span className="ml-auto shrink-0 text-xs text-muted-foreground num">{meta}</span>}
      </button>
    </div>
  )
}

export function GoalTree(props: GoalTreeProps) {
  const { goals, selection, issues, showGroups, onSelect, onSelectCriterion, onAddGoal, onAddGroup } = props
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    setCollapsed((previous) => {
      const next = new Set(previous)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="flex flex-col gap-0.5" role="tree" aria-label="Цілі, групи і критерії">
      {goals.map((goal, goalIndex) => {
        const goalOpen = !collapsed.has(goal.id)
        const goalActive = selection.kind === 'goal' && selection.goalId === goal.id
        const criteriaTotal = goal.groups.reduce((sum, group) => sum + group.criteria.length, 0)
        return (
          <div key={goal.id} role="treeitem" aria-expanded={showGroups ? goalOpen : undefined} aria-selected={goalActive}>
            <TreeRow
              depth={0}
              active={goalActive}
              label={stripGoalPrefix(goal.name)}
              meta={showGroups ? String(criteriaTotal) : undefined}
              marker={markerFor(issues.filter((issue) => issue.goalId === goal.id && !issue.groupId))}
              expanded={goalOpen}
              onToggle={showGroups ? () => toggle(goal.id) : undefined}
              onClick={() => onSelect({ kind: 'goal', goalId: goal.id })}
              prefix={
                <span className="flex h-5 shrink-0 items-center rounded bg-primary/12 px-1.5 text-[11px] font-semibold text-primary num">
                  G{goalIndex + 1}
                </span>
              }
            />
            {showGroups && goalOpen && (
              <div role="group">
                {goal.groups.map((group, groupIndex) => {
                  const groupOpen = !collapsed.has(group.id)
                  const groupActive = selection.kind === 'group' && selection.groupId === group.id
                  return (
                    <div key={group.id} role="treeitem" aria-expanded={groupOpen} aria-selected={groupActive}>
                      <TreeRow
                        depth={1}
                        active={groupActive}
                        label={group.name}
                        meta={String(group.criteria.length)}
                        marker={markerFor(issues.filter((issue) => issue.groupId === group.id))}
                        expanded={groupOpen}
                        onToggle={() => toggle(group.id)}
                        onClick={() => onSelect({ kind: 'group', goalId: goal.id, groupId: group.id })}
                        prefix={<span className="shrink-0 text-xs text-muted-foreground num">S{groupIndex + 1}</span>}
                      />
                      {groupOpen && (
                        <div role="group">
                          {group.criteria.map((criterion, criterionIndex) => {
                            const Direction = criterion.direction === 'benefit' ? ArrowUp : ArrowDown
                            return (
                              <TreeRow
                                key={criterion.id}
                                depth={2}
                                active={false}
                                label={criterion.name}
                                onClick={() => onSelectCriterion(goal.id, group.id, criterionIndex)}
                                prefix={
                                  <Direction
                                    className={cn('size-3 shrink-0', criterion.direction === 'benefit' ? 'text-success' : 'text-primary')}
                                    aria-label={criterion.direction === 'benefit' ? 'максимізація' : 'мінімізація'}
                                  />
                                }
                              />
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
                <div style={{ paddingLeft: 24 }}>
                  <Button variant="ghost" size="xs" onClick={() => onAddGroup(goal.id)} className="text-muted-foreground">
                    <Plus />
                    Група
                  </Button>
                </div>
              </div>
            )}
          </div>
        )
      })}
      <Button variant="ghost" size="sm" onClick={onAddGoal} className="mt-1 justify-start text-muted-foreground">
        <Plus />
        Додати ціль
      </Button>
    </div>
  )
}
