import type * as React from 'react'
import { cn } from '@/lib/utils'

type InputProps = React.ComponentProps<'input'>

function Input(props: InputProps) {
  const { className, type, ...rest } = props
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-9 w-full min-w-0 rounded-md border border-input bg-card px-3 py-1 text-[13px] shadow-xs transition-[color,box-shadow,border-color] outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
        'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-invalid:border-destructive aria-invalid:ring-destructive/20',
        className,
      )}
      {...rest}
    />
  )
}

export { Input }
