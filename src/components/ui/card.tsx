import type * as React from 'react'
import { cn } from '@/lib/utils'

type DivProps = React.ComponentProps<'div'>

function Card(props: DivProps) {
  const { className, ...rest } = props
  return (
    <div
      data-slot="card"
      className={cn('bg-card text-card-foreground flex flex-col gap-5 rounded-xl border py-5 shadow-sm', className)}
      {...rest}
    />
  )
}

function CardHeader(props: DivProps) {
  const { className, ...rest } = props
  return <div data-slot="card-header" className={cn('flex flex-col gap-1.5 px-5', className)} {...rest} />
}

function CardTitle(props: DivProps) {
  const { className, ...rest } = props
  return <div data-slot="card-title" className={cn('leading-none font-semibold', className)} {...rest} />
}

function CardDescription(props: DivProps) {
  const { className, ...rest } = props
  return <div data-slot="card-description" className={cn('text-muted-foreground text-sm', className)} {...rest} />
}

function CardContent(props: DivProps) {
  const { className, ...rest } = props
  return <div data-slot="card-content" className={cn('px-5', className)} {...rest} />
}

export { Card, CardContent, CardDescription, CardHeader, CardTitle }
