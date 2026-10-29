import type * as React from 'react'
import { cn } from '@/lib/utils'

type TableProps = React.ComponentProps<'table'>
type SectionProps = React.ComponentProps<'tbody'>
type RowProps = React.ComponentProps<'tr'>
type HeadProps = React.ComponentProps<'th'>
type CellProps = React.ComponentProps<'td'>

function Table(props: TableProps) {
  const { className, ...rest } = props
  return (
    <div data-slot="table-container" className="relative w-full overflow-x-auto">
      <table data-slot="table" className={cn('w-full caption-bottom text-sm', className)} {...rest} />
    </div>
  )
}

function TableHeader(props: SectionProps) {
  const { className, ...rest } = props
  return <thead data-slot="table-header" className={cn('[&_tr]:border-b', className)} {...rest} />
}

function TableBody(props: SectionProps) {
  const { className, ...rest } = props
  return <tbody data-slot="table-body" className={cn('[&_tr:last-child]:border-0', className)} {...rest} />
}

function TableRow(props: RowProps) {
  const { className, ...rest } = props
  return <tr data-slot="table-row" className={cn('border-b transition-colors hover:bg-muted/50', className)} {...rest} />
}

function TableHead(props: HeadProps) {
  const { className, ...rest } = props
  return (
    <th
      data-slot="table-head"
      className={cn('h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-muted-foreground', className)}
      {...rest}
    />
  )
}

function TableCell(props: CellProps) {
  const { className, ...rest } = props
  return <td data-slot="table-cell" className={cn('p-2 align-middle whitespace-nowrap', className)} {...rest} />
}

export { Table, TableBody, TableCell, TableHead, TableHeader, TableRow }
