import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type LegendItem = {
  key: string
  label: string
  swatch: ReactNode
  muted?: boolean
}

type ChartLegendProps = {
  items: LegendItem[]
  activeKey?: string | null
  onHover?: (key: string | null) => void
  className?: string
}

export function ChartLegend(props: ChartLegendProps) {
  const { items, activeKey, onHover, className } = props
  return (
    <ul className={cn('flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground', className)}>
      {items.map((item) => (
        <li
          key={item.key}
          onMouseEnter={() => onHover?.(item.key)}
          onMouseLeave={() => onHover?.(null)}
          className={cn(
            'flex items-center gap-1.5 transition-opacity',
            activeKey && activeKey !== item.key && 'opacity-40',
            item.muted && 'opacity-60',
          )}
        >
          {item.swatch}
          <span className="text-foreground">{item.label}</span>
        </li>
      ))}
    </ul>
  )
}
