import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type StatProps = {
  label: string
  value: ReactNode
  hint?: ReactNode
  className?: string
}

export function Stat(props: StatProps) {
  const { label, value, hint, className } = props
  return (
    <div className={cn('flex min-w-0 flex-col gap-1 px-5 py-4', className)}>
      <div className="eyebrow">{label}</div>
      <div className="truncate text-[22px] leading-8 font-semibold tracking-[-0.02em] num">{value}</div>
      {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
    </div>
  )
}
