import { useState } from 'react'
import { AltDot } from '@/components/app/AltDot'
import type { AlternativeResult } from '@/core/analysis'
import type { Vector } from '@/core/matrix'
import { goalColorVar } from '@/lib/colors'
import type { DisplayRank } from '@/lib/ranking'
import { formatRank } from '@/lib/ranking'
import { cn, formatFixed, formatNumber } from '@/lib/utils'

type ZStarBreakdownProps = {
  ranking: AlternativeResult[]
  colorById: Map<string, string>
  rankById: Map<string, DisplayRank>
  target: Vector
  goalNames: string[]
}

export function ZStarBreakdown(props: ZStarBreakdownProps) {
  const { ranking, colorById, rankById, target, goalNames } = props
  const [hovered, setHovered] = useState<string | null>(null)
  const maximum = Math.max(target.reduce((acc, value) => acc + value, 0), 1e-9)
  const scale = Math.max(maximum, 1)
  const onePosition = (1 / scale) * 100
  const maxPosition = (maximum / scale) * 100

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 right-14 left-28">
          <div className="absolute inset-y-0 border-l border-dashed border-foreground/25" style={{ left: `${onePosition}%` }} />
          {Math.abs(maximum - 1) > 1e-6 && (
            <div className="absolute inset-y-0 border-l border-dashed border-foreground/50" style={{ left: `${maxPosition}%` }} />
          )}
        </div>
        <ul className="relative flex flex-col gap-1.5">
          {ranking.map((alt) => {
            const z = alt.satisfaction?.z ?? []
            const zStar = alt.satisfaction?.zStar ?? 0
            const rank = rankById.get(alt.id)
            const dim = hovered !== null && hovered !== alt.id
            return (
              <li
                key={alt.id}
                className={cn('grid grid-cols-[7rem_1fr_3.5rem] items-center gap-0 transition-opacity', dim && 'opacity-45')}
                onMouseEnter={() => setHovered(alt.id)}
                onMouseLeave={() => setHovered(null)}
              >
                <div className="flex min-w-0 items-center gap-2 pr-3 text-[13px]">
                  <span className="w-5 shrink-0 text-right text-xs text-muted-foreground num">{rank ? formatRank(rank) : ''}</span>
                  <AltDot color={colorById.get(alt.id) ?? 'var(--primary)'} />
                  <span className="truncate font-medium">{alt.name}</span>
                </div>
                <div className="flex h-6 items-stretch gap-[2px]" title={goalNames.map((name, index) => `${name}: z·t = ${formatFixed((z[index] ?? 0) * (target[index] ?? 0))}`).join('\n')}>
                  {target.map((weight, index) => {
                    const part = (z[index] ?? 0) * weight
                    if (part <= 0) return null
                    return (
                      <div
                        key={index}
                        className="first:rounded-l-[4px] last:rounded-r-[4px]"
                        style={{ width: `${(part / scale) * 100}%`, backgroundColor: goalColorVar(index) }}
                      />
                    )
                  })}
                </div>
                <span className="text-right text-[13px] font-semibold num">{formatFixed(zStar)}</span>
              </li>
            )
          })}
        </ul>
        <div className="relative mt-1 ml-28 mr-14 h-4 text-[10px] text-muted-foreground num">
          <span className="absolute -translate-x-1/2" style={{ left: '0%' }}>0</span>
          <span className="absolute -translate-x-1/2" style={{ left: `${onePosition}%` }}>1</span>
          {Math.abs(maximum - 1) > 1e-6 && (
            <span className="absolute -translate-x-1/2 font-medium whitespace-nowrap text-foreground" style={{ left: `${maxPosition}%` }}>
              Σt = {formatNumber(maximum, 2)}
            </span>
          )}
        </div>
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5 border-t pt-3 text-xs">
        {goalNames.map((name, index) => (
          <li key={name} className="flex items-center gap-1.5">
            <span aria-hidden className="h-2.5 w-3 rounded-[3px]" style={{ backgroundColor: goalColorVar(index) }} />
            <span>
              z<sub>{index + 1}</sub>·t<sub>{index + 1}</sub>
            </span>
            <span className="text-muted-foreground">{name}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
