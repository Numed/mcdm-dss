import { useState } from 'react'
import type { CellFlag } from '@/app/validation'
import { parseLocaleNumber } from '@/lib/parse'
import { formatCellValue } from '@/lib/grid'
import { cn } from '@/lib/utils'

type GridNumberCellProps = {
  row: number
  col: number
  value: number | undefined
  flag?: CellFlag
  ariaLabel: string
  onCommit: (value: number) => void
  min?: number
  max?: number
}

type CellDraft = {
  text: string
  base: number | undefined
}

type GridTextCellProps = {
  row: number
  col: number
  value: string
  ariaLabel: string
  onCommit: (value: string) => void
  className?: string
}

const CELL_BASE =
  'h-9 w-full min-w-0 border-0 bg-transparent px-3 text-[13px] outline-none transition-colors placeholder:text-muted-foreground/60 focus:bg-card focus:ring-2 focus:ring-primary focus:ring-inset'

function flagClass(flag: CellFlag | undefined): string {
  if (flag === 'negative' || flag === 'zero-cost') return 'bg-destructive/10 text-destructive'
  if (flag === 'zero') return 'bg-warning/10'
  return ''
}

function flagTitle(flag: CellFlag | undefined): string | undefined {
  if (flag === 'negative') return 'Від’ємне значення: функція належності дорівнюватиме 0'
  if (flag === 'zero-cost') return 'Нуль у критерії мінімізації: min/x не визначено'
  if (flag === 'zero') return 'Нульове або порожнє значення'
  return undefined
}

export function GridNumberCell(props: GridNumberCellProps) {
  const { row, col, value, flag, ariaLabel, onCommit, min, max } = props
  const [draft, setDraft] = useState<CellDraft | null>(null)
  const activeDraft = draft !== null && draft.base === value ? draft.text : null
  const invalid = activeDraft !== null && activeDraft.trim() !== '' && parseLocaleNumber(activeDraft) === null

  const handleChange = (raw: string) => {
    const parsed = parseLocaleNumber(raw)
    if (parsed === null) {
      setDraft({ text: raw, base: value })
      return
    }
    let next = parsed
    if (min !== undefined) next = Math.max(min, next)
    if (max !== undefined) next = Math.min(max, next)
    setDraft({ text: raw, base: next })
    onCommit(next)
  }

  return (
    <input
      inputMode="decimal"
      autoComplete="off"
      spellCheck={false}
      data-grid-row={row}
      data-grid-col={col}
      aria-label={ariaLabel}
      aria-invalid={invalid || flag === 'negative' || flag === 'zero-cost' || undefined}
      title={flagTitle(flag)}
      value={activeDraft ?? formatCellValue(value)}
      placeholder="—"
      onFocus={(event) => {
        setDraft({ text: formatCellValue(value), base: value })
        event.target.select()
      }}
      onChange={(event) => handleChange(event.target.value)}
      onBlur={() => setDraft(null)}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          setDraft(null)
          event.currentTarget.blur()
        }
      }}
      className={cn(CELL_BASE, 'text-right num', flagClass(flag), invalid && 'ring-2 ring-destructive ring-inset')}
    />
  )
}

export function GridTextCell(props: GridTextCellProps) {
  const { row, col, value, ariaLabel, onCommit, className } = props
  return (
    <input
      autoComplete="off"
      data-grid-row={row}
      data-grid-col={col}
      aria-label={ariaLabel}
      value={value}
      onFocus={(event) => event.target.select()}
      onChange={(event) => onCommit(event.target.value)}
      className={cn(CELL_BASE, 'font-medium', className)}
    />
  )
}
