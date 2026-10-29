import type { ResultMeta } from '@/app/useResultMeta'
import { normalizedZ } from '@/app/resultTables'
import { AltDot } from '@/components/app/AltDot'
import { MiniBar } from '@/components/app/MiniBar'
import { SecurityBadge } from '@/components/app/SecurityBadge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { AnalysisResult } from '@/core/analysis'
import { goalColorVar } from '@/lib/colors'
import { formatRank } from '@/lib/ranking'
import { cn, formatFixed } from '@/lib/utils'

type RankingTableProps = {
  analysis: AnalysisResult
  meta: ResultMeta
}

export function RankingTable(props: RankingTableProps) {
  const { analysis, meta } = props
  const excluded = analysis.alternatives.filter((alt) => !alt.passesSecurity)
  const maxZ = analysis.target.reduce((acc, value) => acc + value, 0)

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-14 pl-5">Ранг</TableHead>
          <TableHead>Альтернатива</TableHead>
          {meta.goalLabels.map((label, index) => (
            <TableHead key={label} className="text-right" title={label}>
              G{index + 1}
            </TableHead>
          ))}
          <TableHead>Безпека</TableHead>
          <TableHead className="text-right normal-case">Z*</TableHead>
          <TableHead className="pr-5 text-right normal-case">Z*/Σt</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[...analysis.ranking, ...excluded].map((alt) => {
          const rank = meta.rankById.get(alt.id)
          const zStar = alt.satisfaction?.zStar ?? 0
          const first = rank?.rank === 1
          return (
            <TableRow key={alt.id} className={cn(!alt.passesSecurity && 'text-muted-foreground', first && 'bg-primary/[0.035]')}>
              <TableCell className="pl-5">
                <span
                  className={cn(
                    'inline-flex h-6 min-w-6 items-center justify-center rounded-md px-1.5 text-xs font-semibold num',
                    first ? 'bg-primary text-primary-foreground' : 'bg-muted',
                  )}
                >
                  {rank ? formatRank(rank) : '-'}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2.5">
                  <AltDot color={meta.colorById.get(alt.id) ?? 'var(--primary)'} muted={!alt.passesSecurity} />
                  <span className={cn('font-medium', alt.passesSecurity && 'text-foreground')}>{alt.name}</span>
                </div>
              </TableCell>
              {alt.goalScores.map((score, index) => (
                <TableCell key={index} className="text-right">
                  <MiniBar value={score} color={alt.passesSecurity ? goalColorVar(index) : 'var(--muted-foreground)'} />
                </TableCell>
              ))}
              <TableCell>
                <SecurityBadge level={alt.securityLevel} passes={alt.passesSecurity} />
              </TableCell>
              <TableCell className="text-right">
                {alt.satisfaction ? (
                  <div className="flex items-center justify-end gap-3">
                    <div className="h-2 w-28 overflow-hidden rounded-full bg-muted" aria-hidden>
                      <div
                        className={cn('h-full rounded-full', first ? 'bg-primary' : 'bg-primary/55')}
                        style={{ width: `${maxZ > 0 ? (zStar / maxZ) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="w-12 text-right font-semibold text-foreground num">{formatFixed(zStar)}</span>
                  </div>
                ) : (
                  <span className="text-xs">відсіяно</span>
                )}
              </TableCell>
              <TableCell className="pr-5 text-right text-muted-foreground num">
                {alt.satisfaction ? formatFixed(normalizedZ(zStar, analysis)) : '-'}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
