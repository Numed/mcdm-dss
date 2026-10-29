import { cn, formatFixed } from '@/lib/utils'

type MiniBarProps = {
  value: number
  max?: number
  color?: string
  width?: string
  showValue?: boolean
  className?: string
  label?: string
}

export function MiniBar(props: MiniBarProps) {
  const { value, max = 1, color = 'var(--primary)', width = 'w-16', showValue = true, className, label } = props
  const ratio = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0
  return (
    <div className={cn('flex items-center justify-end gap-2', className)} aria-label={label}>
      {showValue && <span className="text-right num">{formatFixed(value)}</span>}
      <div className={cn('h-1.5 shrink-0 overflow-hidden rounded-full bg-muted', width)} aria-hidden>
        <div className="h-full rounded-full" style={{ width: `${ratio * 100}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}
