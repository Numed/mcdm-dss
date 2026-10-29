import { useId } from 'react'
import { AltDot } from '@/components/app/AltDot'
import type { RobustnessResult } from '@/core/robustness'
import { rankShade } from '@/lib/colors'
import { cn, formatNumber, formatPercent } from '@/lib/utils'

type RankAcceptabilityProps = {
  result: RobustnessResult
  nameById: Map<string, string>
  colorById: Map<string, string>
  compact?: boolean
}

export function RankAcceptability(props: RankAcceptabilityProps) {
  const { result, nameById, colorById, compact = false } = props
  const patternId = useId()
  const total = result.alternatives.length
  const rows = [...result.alternatives].sort(
    (a, b) => b.winShare - a.winShare || (a.meanRank ?? Number.POSITIVE_INFINITY) - (b.meanRank ?? Number.POSITIVE_INFINITY),
  )

  return (
    <div className="flex flex-col gap-4">
      <svg width={0} height={0} className="absolute" aria-hidden>
        <defs>
          <pattern id={patternId} width={6} height={6} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width={6} height={6} fill="var(--muted)" />
            <line x1={0} y1={0} x2={0} y2={6} stroke="var(--muted-foreground)" strokeOpacity={0.35} strokeWidth={2} />
          </pattern>
        </defs>
      </svg>
      <div className={cn('grid items-center gap-x-4 gap-y-2', compact ? 'grid-cols-[6rem_minmax(0,1fr)_3.5rem]' : 'grid-cols-[8rem_minmax(0,1fr)_4.5rem_5.5rem]')}>
        <span className="eyebrow">Альтернатива</span>
        <span className="eyebrow">Розподіл місць</span>
        <span className="text-right eyebrow">1 місце</span>
        {!compact && <span className="text-right eyebrow whitespace-nowrap">Сер. ранг</span>}
        {rows.map((row) => {
          const segments = row.rankCounts.map((count, index) => ({ rank: index + 1, share: count / result.runs }))
          const excludedShare = row.excluded / result.runs
          return (
            <div key={row.id} className="contents">
              <span className="flex min-w-0 items-center gap-2 text-[13px]">
                <AltDot color={colorById.get(row.id) ?? 'var(--primary)'} />
                <span className="truncate font-medium">{nameById.get(row.id)}</span>
              </span>
              <div className="flex h-6 gap-[2px] overflow-hidden rounded-[4px]" role="img" aria-label={`${nameById.get(row.id)}: ${segments.filter((segment) => segment.share > 0).map((segment) => `місце ${segment.rank} — ${formatPercent(segment.share)}`).join(', ')}`}>
                {segments.map((segment) =>
                  segment.share > 0 ? (
                    <div
                      key={segment.rank}
                      title={`Місце ${segment.rank}: ${formatPercent(segment.share)}`}
                      style={{ width: `${segment.share * 100}%`, backgroundColor: rankShade(segment.rank, total) }}
                    />
                  ) : null,
                )}
                {excludedShare > 0 && (
                  <svg
                    width={`${excludedShare * 100}%`}
                    height="100%"
                    className="shrink-0"
                    aria-hidden
                  >
                    <title>Відсіяно критерієм безпеки: {formatPercent(excludedShare)}</title>
                    <rect width="100%" height="100%" fill={`url(#${patternId})`} />
                  </svg>
                )}
              </div>
              <span className="text-right text-[13px] font-semibold num">{formatPercent(row.winShare)}</span>
              {!compact && (
                <span className="text-right text-[13px] text-muted-foreground num">
                  {row.meanRank === null ? '—' : formatNumber(row.meanRank, 2)}
                </span>
              )}
            </div>
          )
        })}
      </div>
      <ul className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t pt-3 text-xs text-muted-foreground">
        {Array.from({ length: total }, (_, index) => (
          <li key={index} className="flex items-center gap-1.5">
            <span className="h-2.5 w-3.5 rounded-[3px]" style={{ backgroundColor: rankShade(index + 1, total) }} aria-hidden />
            {index + 1} місце
          </li>
        ))}
        <li className="flex items-center gap-1.5">
          <svg width={14} height={10} aria-hidden className="rounded-[3px]">
            <rect width={14} height={10} fill={`url(#${patternId})`} />
          </svg>
          відсіяно
        </li>
      </ul>
    </div>
  )
}
