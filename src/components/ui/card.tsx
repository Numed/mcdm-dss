import type * as React from 'react'
import { cn } from '@/lib/utils'

type DivProps = React.ComponentProps<'div'>
type HeadingProps = React.ComponentProps<'h3'>

function Card(props: DivProps) {
  const { className, ...rest } = props
  return (
    <div
      data-slot="card"
      className={cn(
        'flex flex-col rounded-xl border bg-card text-card-foreground shadow-[0_1px_2px_0_rgb(0_0_0/0.03)]',
        className,
      )}
      {...rest}
    />
  )
}

function CardHeader(props: DivProps) {
  const { className, ...rest } = props
  return (
    <div
      data-slot="card-header"
      className={cn('flex flex-wrap items-start gap-x-4 gap-y-1 px-5 pt-4 pb-3', className)}
      {...rest}
    />
  )
}

function CardTitle(props: HeadingProps) {
  const { className, ...rest } = props
  return <h3 data-slot="card-title" className={cn('text-[15px] leading-6 font-semibold tracking-[-0.01em]', className)} {...rest} />
}

function CardDescription(props: DivProps) {
  const { className, ...rest } = props
  return <div data-slot="card-description" className={cn('text-[13px] leading-5 text-muted-foreground', className)} {...rest} />
}

function CardAction(props: DivProps) {
  const { className, ...rest } = props
  return <div data-slot="card-action" className={cn('ml-auto flex items-center gap-2', className)} {...rest} />
}

function CardContent(props: DivProps) {
  const { className, ...rest } = props
  return <div data-slot="card-content" className={cn('px-5 pb-5', className)} {...rest} />
}

export { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle }
