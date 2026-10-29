import * as DialogPrimitive from '@radix-ui/react-dialog'
import type * as React from 'react'
import { cn } from '@/lib/utils'

type ContentProps = React.ComponentProps<typeof DialogPrimitive.Content>

const Sheet = DialogPrimitive.Root
const SheetTitle = DialogPrimitive.Title

function SheetContent(props: ContentProps) {
  const { className, ...rest } = props
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40" />
      <DialogPrimitive.Content
        className={cn('fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r bg-sidebar shadow-xl outline-none', className)}
        {...rest}
      />
    </DialogPrimitive.Portal>
  )
}

export { Sheet, SheetContent, SheetTitle }
