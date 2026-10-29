import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog'
import type * as React from 'react'
import { buttonVariants } from '@/components/ui/button-variants'
import { cn } from '@/lib/utils'

type ContentProps = React.ComponentProps<typeof AlertDialogPrimitive.Content>
type DivProps = React.ComponentProps<'div'>
type TitleProps = React.ComponentProps<typeof AlertDialogPrimitive.Title>
type DescriptionProps = React.ComponentProps<typeof AlertDialogPrimitive.Description>
type ActionProps = React.ComponentProps<typeof AlertDialogPrimitive.Action>
type CancelProps = React.ComponentProps<typeof AlertDialogPrimitive.Cancel>

const AlertDialog = AlertDialogPrimitive.Root
const AlertDialogTrigger = AlertDialogPrimitive.Trigger

function AlertDialogContent(props: ContentProps) {
  const { className, ...rest } = props
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px]" />
      <AlertDialogPrimitive.Content
        className={cn(
          'fixed top-1/2 left-1/2 z-50 grid w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl border bg-card p-6 shadow-xl',
          className,
        )}
        {...rest}
      />
    </AlertDialogPrimitive.Portal>
  )
}

function AlertDialogHeader(props: DivProps) {
  const { className, ...rest } = props
  return <div className={cn('flex flex-col gap-1.5', className)} {...rest} />
}

function AlertDialogFooter(props: DivProps) {
  const { className, ...rest } = props
  return <div className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)} {...rest} />
}

function AlertDialogTitle(props: TitleProps) {
  const { className, ...rest } = props
  return <AlertDialogPrimitive.Title className={cn('text-base font-semibold', className)} {...rest} />
}

function AlertDialogDescription(props: DescriptionProps) {
  const { className, ...rest } = props
  return <AlertDialogPrimitive.Description className={cn('text-[13px] text-muted-foreground', className)} {...rest} />
}

function AlertDialogAction(props: ActionProps) {
  const { className, ...rest } = props
  return <AlertDialogPrimitive.Action className={cn(buttonVariants(), className)} {...rest} />
}

function AlertDialogCancel(props: CancelProps) {
  const { className, ...rest } = props
  return <AlertDialogPrimitive.Cancel className={cn(buttonVariants({ variant: 'outline' }), className)} {...rest} />
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
}
