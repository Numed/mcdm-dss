import { Pencil } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

type InlineEditProps = {
  value: string
  onChange: (value: string) => void
  ariaLabel: string
  placeholder?: string
  className?: string
}

export function InlineEdit(props: InlineEditProps) {
  const { value, onChange, ariaLabel, placeholder, className } = props
  const [draft, setDraft] = useState<string | null>(null)

  const finish = (commit: boolean) => {
    if (commit && draft !== null && draft.trim() !== '') onChange(draft.trim())
    setDraft(null)
  }

  if (draft !== null) {
    return (
      <input
        autoFocus
        aria-label={ariaLabel}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => finish(true)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') finish(true)
          if (event.key === 'Escape') finish(false)
        }}
        onFocus={(event) => event.target.select()}
        className={cn(
          'h-7 min-w-0 rounded-md border border-ring bg-card px-2 text-[13px] font-medium outline-none ring-[3px] ring-ring/30',
          className,
        )}
      />
    )
  }

  return (
    <button
      type="button"
      onClick={() => setDraft(value)}
      aria-label={`${ariaLabel}: ${value}. Натисніть, щоб змінити`}
      className={cn(
        'group flex h-7 min-w-0 cursor-text items-center gap-1.5 rounded-md px-2 text-[13px] font-medium outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50',
        className,
      )}
    >
      <span className="truncate">{value || placeholder}</span>
      <Pencil className="size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
    </button>
  )
}
