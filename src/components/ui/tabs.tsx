import * as TabsPrimitive from '@radix-ui/react-tabs'
import type * as React from 'react'
import { cn } from '@/lib/utils'

type TabsProps = React.ComponentProps<typeof TabsPrimitive.Root>
type TabsListProps = React.ComponentProps<typeof TabsPrimitive.List>
type TabsTriggerProps = React.ComponentProps<typeof TabsPrimitive.Trigger>
type TabsContentProps = React.ComponentProps<typeof TabsPrimitive.Content>

function Tabs(props: TabsProps) {
  const { className, ...rest } = props
  return <TabsPrimitive.Root data-slot="tabs" className={cn('flex flex-col gap-4', className)} {...rest} />
}

function TabsList(props: TabsListProps) {
  const { className, ...rest } = props
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn('inline-flex h-10 w-fit items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground', className)}
      {...rest}
    />
  )
}

function TabsTrigger(props: TabsTriggerProps) {
  const { className, ...rest } = props
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        'inline-flex h-full flex-1 items-center justify-center gap-1.5 rounded-md px-3 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] cursor-pointer',
        'data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
        'focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none [&_svg]:size-4',
        className,
      )}
      {...rest}
    />
  )
}

function TabsContent(props: TabsContentProps) {
  const { className, ...rest } = props
  return <TabsPrimitive.Content data-slot="tabs-content" className={cn('flex-1 outline-none', className)} {...rest} />
}

export { Tabs, TabsContent, TabsList, TabsTrigger }
