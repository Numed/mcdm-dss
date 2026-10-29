import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type RadioCardOption<T extends string | number> = {
  value: T
  title: ReactNode
  description: ReactNode
  aside?: ReactNode
}

type RadioCardGroupProps<T extends string | number> = {
  name: string
  value: T
  options: RadioCardOption<T>[]
  onChange: (value: T) => void
  disabled?: boolean
  columns?: string
}

export function RadioCardGroup<T extends string | number>(props: RadioCardGroupProps<T>) {
  const { name, value, options, onChange, disabled, columns = 'sm:grid-cols-2' } = props
  return (
    <div role="radiogroup" aria-label={name} className={cn('grid gap-3', columns)}>
      {options.map((option) => {
        const active = option.value === value
        return (
          <label
            key={String(option.value)}
            className={cn(
              'relative flex cursor-pointer flex-col gap-1.5 rounded-lg border bg-card p-4 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/50',
              active ? 'border-primary ring-1 ring-primary' : 'hover:border-foreground/20 hover:bg-muted/30',
              disabled && 'pointer-events-none opacity-55',
            )}
          >
            <input
              type="radio"
              name={name}
              className="sr-only"
              checked={active}
              disabled={disabled}
              onChange={() => onChange(option.value)}
            />
            <div className="flex items-start gap-2.5">
              <span
                aria-hidden
                className={cn(
                  'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border',
                  active ? 'border-primary' : 'border-input',
                )}
              >
                {active && <span className="size-2 rounded-full bg-primary" />}
              </span>
              <span className="text-[13px] font-medium">{option.title}</span>
              {option.aside && <span className="ml-auto text-xs text-muted-foreground">{option.aside}</span>}
            </div>
            <div className="pl-6.5 text-xs leading-5 text-muted-foreground">{option.description}</div>
          </label>
        )
      })}
    </div>
  )
}
