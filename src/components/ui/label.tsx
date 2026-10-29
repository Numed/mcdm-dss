import * as LabelPrimitive from '@radix-ui/react-label'
import type * as React from 'react'
import { cn } from '@/lib/utils'

type LabelProps = React.ComponentProps<typeof LabelPrimitive.Root>

function Label(props: LabelProps) {
  const { className, ...rest } = props
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn('flex items-center gap-2 text-sm leading-none font-medium select-none', className)}
      {...rest}
    />
  )
}

export { Label }
