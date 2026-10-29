import katex from 'katex'
import 'katex/dist/katex.min.css'
import { useMemo } from 'react'
import { cn } from '@/lib/utils'

type TexProps = {
  math: string
  display?: boolean
  className?: string
}

export function Tex(props: TexProps) {
  const { math, display = false, className } = props
  const html = useMemo(
    () => katex.renderToString(math, { displayMode: display, throwOnError: false, strict: 'ignore', output: 'html' }),
    [math, display],
  )
  return (
    <span
      className={cn(display ? 'block overflow-x-auto overflow-y-hidden py-1' : 'inline-block', className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

type FormulaProps = {
  math: string
  number?: string
  className?: string
}

export function Formula(props: FormulaProps) {
  const { math, number, className } = props
  return (
    <div className={cn('flex items-center gap-4', className)}>
      <Tex math={math} display className="min-w-0 flex-1" />
      {number && <span className="shrink-0 text-[13px] text-muted-foreground num">({number})</span>}
    </div>
  )
}
