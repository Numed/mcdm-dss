import { SECURITY_LEVELS, type SecurityLevel } from '@/core/security'
import { securityColorVar } from '@/lib/colors'
import { cn } from '@/lib/utils'

type SecurityBadgeProps = {
  level: SecurityLevel
  passes?: boolean
  showLabel?: boolean
  className?: string
}

export function SecurityBadge(props: SecurityBadgeProps) {
  const { level, passes = true, showLabel = false, className } = props
  const meta = SECURITY_LEVELS[level - 1]
  const color = securityColorVar(level)
  return (
    <span
      title={`Рівень безпеки B${level}: ${meta.label}, ${meta.range}`}
      className={cn(
        'inline-flex h-6 items-center gap-1.5 rounded-md border px-1.5 text-xs font-medium whitespace-nowrap',
        !passes && 'border-dashed text-muted-foreground',
        className,
      )}
      style={passes ? { backgroundColor: `color-mix(in oklch, ${color} 12%, transparent)`, borderColor: `color-mix(in oklch, ${color} 35%, transparent)` } : undefined}
    >
      <span aria-hidden className="size-1.5 rounded-full" style={{ backgroundColor: color }} />
      <span>B{level}</span>
      {showLabel && <span className="font-normal text-muted-foreground">{meta.label}</span>}
    </span>
  )
}
