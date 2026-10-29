import { ChevronRight, Plus, Trash2 } from 'lucide-react'
import { notifyRemoved } from '@/app/notify'
import { routeHref } from '@/app/routes'
import { AltDot } from '@/components/app/AltDot'
import { MiniBar } from '@/components/app/MiniBar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { GoalAggregation } from '@/core/goals'
import type { Alternative, Goal } from '@/core/model'
import { SATISFACTION_TERMS } from '@/core/satisfaction'
import { formatFixed, formatNumber } from '@/lib/utils'
import { useProjectStore } from '@/store/projectStore'

type GoalEditorProps = {
  goal: Goal
  goalIndex: number
  alternatives: Alternative[]
  colorById: Map<string, string>
  aggregation: GoalAggregation | null
  goalScores: number[]
  canRemove: boolean
  showGroups: boolean
  onOpenGroup: (groupId: string) => void
  onRemoved: () => void
}

export function GoalEditor(props: GoalEditorProps) {
  const { goal, goalIndex, alternatives, colorById, aggregation, goalScores, canRemove, showGroups, onOpenGroup, onRemoved } = props
  const renameGoal = useProjectStore((state) => state.renameGoal)
  const removeGoal = useProjectStore((state) => state.removeGoal)
  const addGroup = useProjectStore((state) => state.addGroup)
  const term = SATISFACTION_TERMS[goal.satisfactionTerm]
  const nonEmptyGroups = goal.groups.filter((group) => group.criteria.length > 0)
  const weightById = new Map(nonEmptyGroups.map((group, index) => [group.id, aggregation?.groupWeights[index]]))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <label htmlFor={`goal-${goal.id}`} className="eyebrow">
            Ціль G{goalIndex + 1}
          </label>
          <Input
            id={`goal-${goal.id}`}
            value={goal.name}
            onChange={(event) => renameGoal(goal.id, event.target.value)}
            className="h-10 max-w-xl text-base font-semibold"
          />
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Видалити ціль"
          title={canRemove ? 'Видалити ціль' : 'Потрібна хоча б одна ціль'}
          disabled={!canRemove}
          onClick={() => {
            removeGoal(goal.id)
            notifyRemoved('Ціль', goal.name)
            onRemoved()
          }}
        >
          <Trash2 />
        </Button>
      </div>

      <a
        href={routeHref('params')}
        className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3 text-[13px] outline-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <span className="text-muted-foreground">Компонента вектора задоволення</span>
        <span className="font-medium">
          t{goalIndex + 1} = {formatNumber(term?.value ?? 0, 1)}
        </span>
        <span className="text-muted-foreground">«{term?.label}»</span>
        <span className="ml-auto flex items-center gap-1 text-xs text-primary">
          Змінити в параметрах <ChevronRight className="size-3.5" aria-hidden />
        </span>
      </a>

      {showGroups && (
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="text-[13px] font-semibold">Групи критеріїв</h3>
            <Button variant="outline" size="xs" onClick={() => onOpenGroup(addGroup(goal.id))}>
              <Plus />
              Група
            </Button>
          </div>
          <ul className="divide-y overflow-hidden rounded-lg border">
            {goal.groups.map((group, groupIndex) => {
              const weight = weightById.get(group.id)
              return (
                <li key={group.id}>
                  <button
                    type="button"
                    onClick={() => onOpenGroup(group.id)}
                    className="grid w-full cursor-pointer grid-cols-[2.5rem_minmax(0,1fr)_6rem_10rem_1rem] items-center gap-3 px-4 py-2.5 text-left text-[13px] outline-none hover:bg-muted/40 focus-visible:bg-muted/60"
                  >
                    <span className="text-xs text-muted-foreground num">S{groupIndex + 1}</span>
                    <span className="truncate font-medium">{group.name}</span>
                    <span className="text-xs text-muted-foreground num">
                      {group.criteria.length} крит.
                    </span>
                    {weight === undefined ? (
                      <span className="text-right text-xs text-muted-foreground">не враховується</span>
                    ) : (
                      <MiniBar value={weight} width="w-20" label={`Вага групи ${formatFixed(weight)}`} />
                    )}
                    <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                  </button>
                </li>
              )
            })}
          </ul>
          <p className="text-xs text-muted-foreground">Ваги груп обчислено на другому рівні методу множення матриць.</p>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h3 className="text-[13px] font-semibold">Оцінки альтернатив за ціллю</h3>
        <ul className="grid gap-x-8 gap-y-1.5 rounded-lg border px-4 py-3 sm:grid-cols-2">
          {alternatives.map((alternative, index) => (
            <li key={alternative.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-[13px]">
              <span className="flex min-w-0 items-center gap-2">
                <AltDot color={colorById.get(alternative.id) ?? 'var(--primary)'} />
                <span className="truncate">{alternative.name}</span>
              </span>
              <MiniBar value={goalScores[index] ?? 0} width="w-24" />
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
