import { GripVertical, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { notifyRemoved } from '@/app/notify'
import { useAnalysis, useIssues } from '@/app/useAnalysis'
import { useResultMeta } from '@/app/useResultMeta'
import { issuesForRoute } from '@/app/validation'
import { AltDot } from '@/components/app/AltDot'
import { IssueList } from '@/components/app/IssueList'
import { MiniBar } from '@/components/app/MiniBar'
import { PageHeader } from '@/components/app/PageHeader'
import { SecurityBadge } from '@/components/app/SecurityBadge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { altColorVar, goalColorVar } from '@/lib/colors'
import { formatRank } from '@/lib/ranking'
import { cn, formatFixed, pluralUk } from '@/lib/utils'
import { ALTERNATIVE_COLOR_COUNT, useProjectStore } from '@/store/projectStore'

type DragState = {
  from: number
  over: number
}

type ColorPickerProps = {
  name: string
  color: string
  slot: number
  onChange: (slot: number) => void
}

function ColorPicker(props: ColorPickerProps) {
  const { name, color, slot, onChange } = props
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Колір альтернативи ${name}`}
          className="flex size-7 cursor-pointer items-center justify-center rounded-md outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <AltDot color={color} className="size-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-auto min-w-0">
        <DropdownMenuLabel>Колір на графіках</DropdownMenuLabel>
        <div className="grid grid-cols-4 gap-1 p-1">
          {Array.from({ length: ALTERNATIVE_COLOR_COUNT }, (_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Колір ${index + 1}`}
              aria-pressed={index === slot}
              onClick={() => onChange(index)}
              className={cn(
                'flex size-7 cursor-pointer items-center justify-center rounded-md outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50',
                index === slot && 'bg-accent ring-1 ring-border',
              )}
            >
              <span className="size-4 rounded-full" style={{ backgroundColor: altColorVar(index) }} />
            </button>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function AlternativesPage() {
  const project = useProjectStore((state) => state.project)
  const addAlternative = useProjectStore((state) => state.addAlternative)
  const renameAlternative = useProjectStore((state) => state.renameAlternative)
  const removeAlternative = useProjectStore((state) => state.removeAlternative)
  const moveAlternative = useProjectStore((state) => state.moveAlternative)
  const setAlternativeColor = useProjectStore((state) => state.setAlternativeColor)
  const analysis = useAnalysis()
  const meta = useResultMeta(project, analysis)
  const issues = issuesForRoute(useIssues(), 'alternatives')
  const [drag, setDrag] = useState<DragState | null>(null)
  const count = project.alternatives.length

  const focusNewest = () => {
    requestAnimationFrame(() => {
      const inputs = document.querySelectorAll<HTMLInputElement>('[data-alt-name]')
      const last = inputs[inputs.length - 1]
      last?.focus()
      last?.select()
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Альтернативи"
        description="Множина X = {x₁, …, xₙ}, з якої обирається найкращий варіант. Порядок і колір зберігаються на всіх графіках."
        actions={
          <Button
            size="sm"
            onClick={() => {
              addAlternative()
              focusNewest()
            }}
          >
            <Plus />
            Додати альтернативу
          </Button>
        }
      />

      <IssueList issues={issues} />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b">
                <th className="w-10" aria-label="Порядок" />
                <th className="h-9 w-12 px-2 text-left eyebrow normal-case">x</th>
                <th className="h-9 px-2 text-left eyebrow">Назва</th>
                {meta.goalLabels.map((label, index) => (
                  <th key={label} title={label} className="h-9 px-3 text-right eyebrow">
                    G{index + 1}
                  </th>
                ))}
                <th className="h-9 px-3 text-left eyebrow">Безпека</th>
                <th className="h-9 px-3 text-right eyebrow">Ранг</th>
                <th className="w-12" aria-label="Дії" />
              </tr>
            </thead>
            <tbody>
              {project.alternatives.map((alternative, index) => {
                const result = analysis.alternatives[index]
                const rank = meta.rankById.get(alternative.id)
                const slot = alternative.color ?? index
                const isDragged = drag?.from === index
                const isTarget = drag !== null && drag.over === index && drag.from !== index
                return (
                  <tr
                    key={alternative.id}
                    onDragOver={(event) => {
                      if (!drag) return
                      event.preventDefault()
                      if (drag.over !== index) setDrag({ ...drag, over: index })
                    }}
                    onDrop={(event) => {
                      event.preventDefault()
                      if (drag) moveAlternative(drag.from, index)
                      setDrag(null)
                    }}
                    className={cn(
                      'group/row border-b transition-colors last:border-b-0 hover:bg-muted/40',
                      isDragged && 'opacity-40',
                      isTarget && drag.from > index && 'shadow-[inset_0_2px_0_var(--primary)]',
                      isTarget && drag.from < index && 'shadow-[inset_0_-2px_0_var(--primary)]',
                    )}
                  >
                    <td className="pl-2">
                      <button
                        type="button"
                        draggable
                        aria-label={`Перемістити ${alternative.name}. Стрілки вгору і вниз змінюють порядок`}
                        onDragStart={(event) => {
                          event.dataTransfer.effectAllowed = 'move'
                          event.dataTransfer.setData('text/plain', alternative.id)
                          setDrag({ from: index, over: index })
                        }}
                        onDragEnd={() => setDrag(null)}
                        onKeyDown={(event) => {
                          if (event.key === 'ArrowUp' && index > 0) {
                            event.preventDefault()
                            moveAlternative(index, index - 1)
                          }
                          if (event.key === 'ArrowDown' && index < count - 1) {
                            event.preventDefault()
                            moveAlternative(index, index + 1)
                          }
                        }}
                        className="flex size-7 cursor-grab items-center justify-center rounded-md text-muted-foreground/60 outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 active:cursor-grabbing"
                      >
                        <GripVertical className="size-4" aria-hidden />
                      </button>
                    </td>
                    <td className="px-2 text-xs text-muted-foreground num">x{index + 1}</td>
                    <td className="py-1.5 pr-2">
                      <div className="flex items-center gap-1">
                        <ColorPicker
                          name={alternative.name}
                          color={altColorVar(slot)}
                          slot={slot}
                          onChange={(value) => setAlternativeColor(alternative.id, value)}
                        />
                        <input
                          data-alt-name
                          value={alternative.name}
                          aria-label={`Назва альтернативи x${index + 1}`}
                          aria-invalid={alternative.name.trim() === '' || undefined}
                          onChange={(event) => renameAlternative(alternative.id, event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') event.currentTarget.blur()
                          }}
                          className="h-8 w-full min-w-48 rounded-md border border-transparent bg-transparent px-2 font-medium outline-none hover:border-input focus:border-ring focus:bg-card focus:ring-[3px] focus:ring-ring/30 aria-invalid:border-destructive"
                        />
                      </div>
                    </td>
                    {meta.goalLabels.map((label, goalIndex) => (
                      <td key={label} className="px-3">
                        <MiniBar value={result?.goalScores[goalIndex] ?? 0} color={goalColorVar(goalIndex)} width="w-14" />
                      </td>
                    ))}
                    <td className="px-3">
                      {result && <SecurityBadge level={result.securityLevel} passes={result.passesSecurity} />}
                    </td>
                    <td className="px-3 text-right font-semibold num">
                      {rank ? formatRank(rank) : <span className="text-xs font-normal text-muted-foreground">відсіяно</span>}
                    </td>
                    <td className="pr-2 text-right">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label={`Видалити ${alternative.name}`}
                        title={count <= 2 ? 'Потрібно щонайменше 2 альтернативи' : undefined}
                        disabled={count <= 2}
                        onClick={() => {
                          removeAlternative(alternative.id)
                          notifyRemoved('Альтернативу', alternative.name)
                        }}
                        className="opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100"
                      >
                        <Trash2 />
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/30 px-4 py-2.5 text-xs text-muted-foreground">
          <span>
            {count} {pluralUk(count, 'альтернатива', 'альтернативи', 'альтернатив')} · перетягніть за{' '}
            <GripVertical className="inline size-3.5 align-[-2px]" aria-hidden /> або використайте стрілки, щоб змінити порядок
          </span>
          <span>Оцінки й ранги оновлюються одразу · Z* лідера {formatFixed(analysis.best?.satisfaction?.zStar ?? 0)}</span>
        </div>
      </Card>
    </div>
  )
}
