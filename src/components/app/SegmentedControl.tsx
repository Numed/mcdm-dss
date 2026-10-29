import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type SegmentOption<T extends string> = {
  value: T
  label: ReactNode
  title?: string
}

type SegmentedControlProps<T extends string> = {
  value: T
  options: SegmentOption<T>[]
  onChange: (value: T) => void
  ariaLabel: string
  size?: 'sm' | 'md'
  className?: string
}

export function SegmentedControl<T extends string>(props: SegmentedControlProps<T>) {
  const { value, options, onChange, ariaLabel, size = 'md', className } = props

  const move = (direction: number) => {
    const index = options.findIndex((option) => option.value === value)
    const next = options[(index + direction + options.length) % options.length]
    if (next) onChange(next.value)
  }

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn('inline-flex shrink-0 items-center rounded-md border bg-muted/60 p-0.5', className)}
      onKeyDown={(event) => {
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
          event.preventDefault()
          move(1)
        }
        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
          event.preventDefault()
          move(-1)
        }
      }}
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            title={option.title}
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex cursor-pointer items-center justify-center gap-1 rounded-[5px] font-medium whitespace-nowrap text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50',
              size === 'sm' ? 'h-6 px-2 text-xs' : 'h-7 px-3 text-[13px]',
              active && 'bg-card text-foreground shadow-xs',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
