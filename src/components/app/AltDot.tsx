import { cn } from '@/lib/utils'

type AltDotProps = {
  color: string
  className?: string
  muted?: boolean
}

export function AltDot(props: AltDotProps) {
  const { color, className, muted } = props
  return (
    <span
      aria-hidden
      className={cn('inline-block size-2.5 shrink-0 rounded-full ring-2 ring-card', muted && 'opacity-40 grayscale', className)}
      style={{ backgroundColor: color }}
    />
  )
}
