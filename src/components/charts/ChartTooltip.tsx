import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type ChartTooltipProps = {
  x: number
  y: number
  containerWidth: number
  children: ReactNode
  className?: string
}

type TooltipRowProps = {
  label: ReactNode
  value: ReactNode
}

const OFFSET = 14
const WIDTH = 232

export function ChartTooltip(props: ChartTooltipProps) {
  const { x, y, containerWidth, children, className } = props
  const flip = x + OFFSET + WIDTH > containerWidth
  const left = flip ? x - OFFSET - WIDTH : x + OFFSET
  return (
    <div
      role="tooltip"
      className={cn(
        'pointer-events-none absolute z-20 rounded-lg border bg-popover px-3 py-2.5 text-xs text-popover-foreground shadow-lg',
        className,
      )}
      style={{ left: Math.max(0, left), top: Math.max(0, y - 12), width: WIDTH }}
    >
      {children}
    </div>
  )
}

export function TooltipRow(props: TooltipRowProps) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-0.5">
      <span className="text-muted-foreground">{props.label}</span>
      <span className="font-medium num">{props.value}</span>
    </div>
  )
}
