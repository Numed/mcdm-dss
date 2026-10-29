import * as SliderPrimitive from '@radix-ui/react-slider'
import type * as React from 'react'
import { cn } from '@/lib/utils'

type SliderProps = React.ComponentProps<typeof SliderPrimitive.Root> & {
  thumbLabel?: string
}

function Slider(props: SliderProps) {
  const { className, thumbLabel, ...rest } = props
  return (
    <SliderPrimitive.Root
      className={cn('relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50', className)}
      {...rest}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-muted">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        aria-label={thumbLabel}
        className="block size-4 cursor-grab rounded-full border-2 border-primary bg-card shadow-sm transition-[box-shadow] outline-none hover:ring-4 hover:ring-primary/15 focus-visible:ring-4 focus-visible:ring-primary/30 active:cursor-grabbing"
      />
    </SliderPrimitive.Root>
  )
}

export { Slider }
