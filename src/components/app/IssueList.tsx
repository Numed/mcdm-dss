import { CircleAlert, TriangleAlert } from 'lucide-react'
import type { Issue } from '@/app/validation'
import { cn } from '@/lib/utils'

type IssueListProps = {
  issues: Issue[]
  onSelect?: (issue: Issue) => void
  className?: string
}

export function IssueList(props: IssueListProps) {
  const { issues, onSelect, className } = props
  if (issues.length === 0) return null
  return (
    <ul className={cn('flex flex-col divide-y overflow-hidden rounded-lg border bg-card', className)} aria-label="Зауваження до даних">
      {issues.map((issue) => {
        const Icon = issue.level === 'error' ? CircleAlert : TriangleAlert
        return (
          <li key={issue.id}>
            <button
              type="button"
              disabled={!onSelect}
              onClick={() => onSelect?.(issue)}
              className="flex w-full cursor-pointer items-start gap-2.5 px-4 py-2.5 text-left text-[13px] outline-none hover:bg-muted/40 focus-visible:bg-muted/60 disabled:cursor-default"
            >
              <Icon
                className={cn('mt-0.5 size-4 shrink-0', issue.level === 'error' ? 'text-destructive' : 'text-warning')}
                aria-label={issue.level === 'error' ? 'Помилка' : 'Попередження'}
              />
              <span>{issue.message}</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
