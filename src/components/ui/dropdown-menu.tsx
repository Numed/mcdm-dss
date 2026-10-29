import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import type * as React from 'react'
import { cn } from '@/lib/utils'

type ContentProps = React.ComponentProps<typeof DropdownMenuPrimitive.Content>
type ItemProps = React.ComponentProps<typeof DropdownMenuPrimitive.Item>
type LabelProps = React.ComponentProps<typeof DropdownMenuPrimitive.Label>
type SeparatorProps = React.ComponentProps<typeof DropdownMenuPrimitive.Separator>
type RadioItemProps = React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>

const DropdownMenu = DropdownMenuPrimitive.Root
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

function DropdownMenuContent(props: ContentProps) {
  const { className, sideOffset = 6, ...rest } = props
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        className={cn(
          'z-50 min-w-48 overflow-hidden rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg',
          className,
        )}
        {...rest}
      />
    </DropdownMenuPrimitive.Portal>
  )
}

function DropdownMenuItem(props: ItemProps) {
  const { className, ...rest } = props
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      className={cn(
        "relative flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[13px] outline-none select-none focus:bg-accent data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:size-4 [&_svg]:text-muted-foreground",
        className,
      )}
      {...rest}
    />
  )
}

function DropdownMenuRadioItem(props: RadioItemProps) {
  const { className, children, ...rest } = props
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cn(
        'relative flex cursor-pointer items-center gap-2 rounded-md py-1.5 pr-2 pl-7 text-[13px] outline-none select-none focus:bg-accent [&_svg]:size-4 [&_svg]:text-muted-foreground',
        className,
      )}
      {...rest}
    >
      <span className="absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <span className="block size-1.5 rounded-full bg-foreground" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  )
}

function DropdownMenuLabel(props: LabelProps) {
  const { className, ...rest } = props
  return <DropdownMenuPrimitive.Label className={cn('px-2 py-1.5 eyebrow', className)} {...rest} />
}

function DropdownMenuSeparator(props: SeparatorProps) {
  const { className, ...rest } = props
  return <DropdownMenuPrimitive.Separator className={cn('-mx-1 my-1 h-px bg-border', className)} {...rest} />
}

export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
}
