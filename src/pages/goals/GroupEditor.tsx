import { ClipboardPaste, Plus, Trash2 } from 'lucide-react'
import type { ClipboardEvent } from 'react'
import { notifyPaste, notifyRemoved } from '@/app/notify'
import { cellFlag } from '@/app/validation'
import { AltDot } from '@/components/app/AltDot'
import { GridNumberCell, GridTextCell } from '@/components/app/DataGrid'
import { type SegmentOption, SegmentedControl } from '@/components/app/SegmentedControl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Alternative, CriteriaGroup } from '@/core/model'
import type { CriterionDirection } from '@/core/normalization'
import { readGridPosition, useGridKeys } from '@/lib/grid'
import { parseClipboardGrid } from '@/lib/parse'
import { formatFixed } from '@/lib/utils'
import { useProjectStore } from '@/store/projectStore'

type GroupEditorProps = {
  goalId: string
  goalLabel: string
  group: CriteriaGroup
  groupIndex: number
  alternatives: Alternative[]
  colorById: Map<string, string>
  criteriaWeights: number[] | null
  canRemove: boolean
  onRemoved: () => void
}

const DIRECTION_OPTIONS: SegmentOption<CriterionDirection>[] = [
  { value: 'benefit', label: '↑ max', title: 'Максимізація: x / max' },
  { value: 'cost', label: '↓ min', title: 'Мінімізація: min / x' },
]

export function GroupEditor(props: GroupEditorProps) {
  const { goalId, goalLabel, group, groupIndex, alternatives, colorById, criteriaWeights, canRemove, onRemoved } = props
  const renameGroup = useProjectStore((state) => state.renameGroup)
  const removeGroup = useProjectStore((state) => state.removeGroup)
  const addCriterion = useProjectStore((state) => state.addCriterion)
  const updateCriterion = useProjectStore((state) => state.updateCriterion)
  const setCriterionValue = useProjectStore((state) => state.setCriterionValue)
  const removeCriterion = useProjectStore((state) => state.removeCriterion)
  const pasteIntoGroup = useProjectStore((state) => state.pasteIntoGroup)
  const onGridKeys = useGridKeys()

  const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
    const position = readGridPosition(event.target)
    if (!position) return
    const rows = parseClipboardGrid(event.clipboardData.getData('text/plain'))
    if (rows.length <= 1 && (rows[0]?.length ?? 0) <= 1) return
    event.preventDefault()
    notifyPaste(pasteIntoGroup(goalId, group.id, position.row, position.col, rows))
  }

  const pasteFromButton = async () => {
    try {
      const text = await navigator.clipboard.readText()
      notifyPaste(pasteIntoGroup(goalId, group.id, 0, 1, parseClipboardGrid(text)))
    } catch {
      notifyPaste({ values: 0, names: 0, created: 0, skipped: 0 })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <label htmlFor={`group-${group.id}`} className="eyebrow">
            {goalLabel} · група S{groupIndex + 1}
          </label>
          <Input
            id={`group-${group.id}`}
            value={group.name}
            onChange={(event) => renameGroup(goalId, group.id, event.target.value)}
            className="h-10 max-w-xl text-base font-semibold"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void pasteFromButton()}>
            <ClipboardPaste />
            Вставити з Excel
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Видалити групу"
            title={canRemove ? 'Видалити групу' : 'У цілі має лишитися хоча б одна група'}
            disabled={!canRemove}
            onClick={() => {
              removeGroup(goalId, group.id)
              notifyRemoved('Групу', group.name)
              onRemoved()
            }}
          >
            <Trash2 />
          </Button>
        </div>
      </div>

      <div
        className="max-h-[min(62vh,640px)] overflow-auto rounded-lg border bg-card"
        onKeyDown={onGridKeys}
        onPaste={handlePaste}
      >
        <table className="w-full border-separate border-spacing-0 text-[13px]">
          <thead>
            <tr>
              <th className="sticky top-0 left-0 z-30 min-w-64 border-r border-b bg-muted px-3 py-2 text-left eyebrow">Критерій</th>
              <th className="sticky top-0 z-20 border-b bg-muted px-3 py-2 text-left eyebrow">Напрям</th>
              {alternatives.map((alternative) => (
                <th key={alternative.id} className="sticky top-0 z-20 min-w-28 border-b bg-muted px-3 py-2 text-right">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
                    <AltDot color={colorById.get(alternative.id) ?? 'var(--primary)'} />
                    <span className="max-w-28 truncate">{alternative.name}</span>
                  </span>
                </th>
              ))}
              <th className="sticky top-0 z-20 border-b bg-muted px-3 py-2 text-right eyebrow normal-case" title="Вага критерію в групі, обчислена методом множення матриць">
                w
              </th>
              <th className="sticky top-0 z-20 w-10 border-b bg-muted" aria-label="Дії" />
            </tr>
          </thead>
          <tbody>
            {group.criteria.map((criterion, rowIndex) => (
              <tr key={criterion.id} className="group/row">
                <td className="sticky left-0 z-10 border-r border-b bg-card p-0 group-hover/row:bg-muted/40">
                  <div className="flex items-center">
                    <span className="w-9 shrink-0 pl-3 text-xs text-muted-foreground num">k{rowIndex + 1}</span>
                    <GridTextCell
                      row={rowIndex}
                      col={0}
                      value={criterion.name}
                      ariaLabel={`Назва критерію k${rowIndex + 1}`}
                      onCommit={(name) => updateCriterion(goalId, group.id, criterion.id, { name })}
                      className="pl-1"
                    />
                  </div>
                </td>
                <td className="border-b px-2 group-hover/row:bg-muted/40">
                  <SegmentedControl<CriterionDirection>
                    size="sm"
                    ariaLabel={`Напрям критерію ${criterion.name}`}
                    value={criterion.direction}
                    options={DIRECTION_OPTIONS}
                    onChange={(direction) => updateCriterion(goalId, group.id, criterion.id, { direction })}
                  />
                </td>
                {alternatives.map((alternative, columnIndex) => (
                  <td key={alternative.id} className="border-b p-0 group-hover/row:bg-muted/40">
                    <GridNumberCell
                      row={rowIndex}
                      col={columnIndex + 1}
                      value={criterion.values[alternative.id]}
                      flag={cellFlag(criterion.values[alternative.id], criterion.direction)}
                      ariaLabel={`${criterion.name}: ${alternative.name}`}
                      onCommit={(value) => setCriterionValue(goalId, group.id, criterion.id, alternative.id, value)}
                    />
                  </td>
                ))}
                <td className="border-b px-3 text-right text-xs text-muted-foreground group-hover/row:bg-muted/40 num">
                  {criteriaWeights ? formatFixed(criteriaWeights[rowIndex] ?? 0) : '-'}
                </td>
                <td className="border-b px-1 group-hover/row:bg-muted/40">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Видалити критерій ${criterion.name}`}
                    onClick={() => {
                      removeCriterion(goalId, group.id, criterion.id)
                      notifyRemoved('Критерій', criterion.name)
                    }}
                    className="opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100"
                  >
                    <Trash2 />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {group.criteria.length === 0 && (
          <p className="px-4 py-6 text-center text-[13px] text-muted-foreground">
            Група порожня. Додайте критерій або вставте таблицю з Excel.
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" size="sm" onClick={() => addCriterion(goalId, group.id)}>
          <Plus />
          Додати критерій
        </Button>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>
            <kbd className="rounded border bg-muted px-1 font-sans">Ctrl+V</kbd> вставляє блок з Excel, починаючи з активної
            комірки
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-warning/30" aria-hidden /> нуль
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-destructive/25" aria-hidden /> помилка
          </span>
        </div>
      </div>
    </div>
  )
}
