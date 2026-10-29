import { Info, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type CalloutProps = {
  title?: string
  children: ReactNode
  tone?: 'info' | 'warning'
  className?: string
}

export function Callout(props: CalloutProps) {
  const { title, children, tone = 'info', className } = props
  const Icon = tone === 'warning' ? TriangleAlert : Info
  return (
    <div
      className={cn(
        'flex gap-3 rounded-lg border px-4 py-3 text-[13px] leading-5',
        tone === 'info' && 'border-primary/20 bg-primary/[0.04]',
        tone === 'warning' && 'border-warning/30 bg-warning/[0.07]',
        className,
      )}
    >
      <Icon className={cn('mt-0.5 size-4 shrink-0', tone === 'info' ? 'text-primary' : 'text-warning')} aria-hidden />
      <div className="min-w-0">
        {title && <div className="font-medium">{title}</div>}
        <div className="text-muted-foreground">{children}</div>
      </div>
    </div>
  )
}
