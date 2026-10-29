import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { ChevronDown } from 'lucide-react'
import type * as React from 'react'
import { cn } from '@/lib/utils'

type ItemProps = React.ComponentProps<typeof AccordionPrimitive.Item>
type TriggerProps = React.ComponentProps<typeof AccordionPrimitive.Trigger>
type ContentProps = React.ComponentProps<typeof AccordionPrimitive.Content>

const Accordion = AccordionPrimitive.Root

function AccordionItem(props: ItemProps) {
  const { className, ...rest } = props
  return <AccordionPrimitive.Item className={cn('border-b last:border-b-0', className)} {...rest} />
}

function AccordionTrigger(props: TriggerProps) {
  const { className, children, ...rest } = props
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        className={cn(
          'flex flex-1 cursor-pointer items-center gap-3 px-5 py-3.5 text-left text-[13px] font-medium outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset [&[data-state=open]>svg]:rotate-180',
          className,
        )}
        {...rest}
      >
        {children}
        <ChevronDown className="ml-auto size-4 shrink-0 text-muted-foreground transition-transform duration-200" aria-hidden />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

function AccordionContent(props: ContentProps) {
  const { className, children, ...rest } = props
  return (
    <AccordionPrimitive.Content className="overflow-hidden" {...rest}>
      <div className={cn('px-5 pt-1 pb-5', className)}>{children}</div>
    </AccordionPrimitive.Content>
  )
}

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger }
