import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type NumberInputProps = {
  value: number
  onCommit: (value: number) => void
  min?: number
  max?: number
  className?: string
  ariaLabel?: string
}

function toDraft(value: number): string {
  return Number.isFinite(value) ? String(value) : ''
}

export function NumberInput(props: NumberInputProps) {
  const { value, onCommit, min, max, className, ariaLabel } = props
  const [editing, setEditing] = useState<string | null>(null)

  const handleChange = (raw: string) => {
    setEditing(raw)
    const parsed = Number.parseFloat(raw.replace(',', '.'))
    if (!Number.isFinite(parsed)) return
    let next = parsed
    if (min !== undefined) next = Math.max(min, next)
    if (max !== undefined) next = Math.min(max, next)
    onCommit(next)
  }

  return (
    <Input
      inputMode="decimal"
      aria-label={ariaLabel}
      value={editing ?? toDraft(value)}
      onFocus={() => setEditing(toDraft(value))}
      onChange={(event) => handleChange(event.target.value)}
      onBlur={() => setEditing(null)}
      className={cn('h-8 w-24 text-right tabular-nums', className)}
    />
  )
}
