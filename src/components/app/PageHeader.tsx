import type { ReactNode } from 'react'

type PageHeaderProps = {
  title: string
  description?: ReactNode
  actions?: ReactNode
}

export function PageHeader(props: PageHeaderProps) {
  const { title, description, actions } = props
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-3xl min-w-0">
        <h1 className="text-[22px] leading-8 font-semibold tracking-[-0.02em]">{title}</h1>
        {description && <p className="mt-1 text-[13px] leading-5 text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
