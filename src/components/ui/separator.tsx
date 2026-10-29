import * as SeparatorPrimitive from '@radix-ui/react-separator'
import type * as React from 'react'
import { cn } from '@/lib/utils'

type SeparatorProps = React.ComponentProps<typeof SeparatorPrimitive.Root>

function Separator(props: SeparatorProps) {
  const { className, orientation = 'horizontal', decorative = true, ...rest } = props
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        'shrink-0 bg-border data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px',
        className,
      )}
      {...rest}
    />
  )
}

export { Separator }
