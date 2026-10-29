import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type EmptyStateProps = {
  icon: LucideIcon
  title: string
  description?: ReactNode
  action?: ReactNode
  className?: string
}

export function EmptyState(props: EmptyStateProps) {
  const { icon: Icon, title, description, action, className } = props
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 px-6 py-12 text-center', className)}>
      <div className="flex size-10 items-center justify-center rounded-lg border bg-muted/60">
        <Icon className="size-5 text-muted-foreground" aria-hidden />
      </div>
      <div className="max-w-sm">
        <div className="text-sm font-medium">{title}</div>
        {description && <div className="mt-1 text-[13px] text-muted-foreground">{description}</div>}
      </div>
      {action}
    </div>
  )
}
