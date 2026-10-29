import { Trophy } from 'lucide-react'
import type { ReactNode } from 'react'
import type { ResultMeta } from '@/app/useResultMeta'
import { normalizedZ } from '@/app/resultTables'
import { AltDot } from '@/components/app/AltDot'
import { MiniBar } from '@/components/app/MiniBar'
import { SecurityBadge } from '@/components/app/SecurityBadge'
import { Card } from '@/components/ui/card'
import type { AnalysisResult } from '@/core/analysis'
import type { Project } from '@/core/model'
import { SECURITY_LEVELS } from '@/core/security'
import { goalColorVar, securityColorVar } from '@/lib/colors'
import { formatFixed, formatPercent, formatVector } from '@/lib/utils'

type ResultsHeroProps = {
  project: Project
  analysis: AnalysisResult
  meta: ResultMeta
}

type HeroStatProps = {
  label: string
  value: ReactNode
  hint: ReactNode
}

function HeroStat(props: HeroStatProps) {
  return (
    <div className="flex min-w-0 flex-col justify-center gap-1 px-5 py-4">
      <div className="flex items-baseline justify-between gap-4">
        <div className="eyebrow">{props.label}</div>
        <div className="text-[17px] leading-6 font-semibold tracking-[-0.01em] whitespace-nowrap num">{props.value}</div>
      </div>
      <div className="text-xs leading-4 text-muted-foreground">{props.hint}</div>
    </div>
  )
}

function leadText(analysis: AnalysisResult): string {
  const [first, second] = analysis.ranking
  if (!first || !second) return 'Єдина допустима альтернатива'
  const best = first.satisfaction?.zStar ?? 0
  const runnerUp = second.satisfaction?.zStar ?? 0
  if (Math.abs(best - runnerUp) < 1e-9) return `Ділить перше місце з «${second.name}»`
  const gap = runnerUp > 0 ? (best - runnerUp) / runnerUp : 0
  return `+${formatPercent(gap)} до другого місця («${second.name}», ${formatFixed(runnerUp)})`
}

export function ResultsHero(props: ResultsHeroProps) {
  const { project, analysis, meta } = props
  const best = analysis.best
  if (!best) return null
  const zStar = best.satisfaction?.zStar ?? 0
  const passed = analysis.ranking.length
  const total = analysis.alternatives.length
  const level = SECURITY_LEVELS[project.minSecurityLevel - 1]

  return (
    <Card className="overflow-hidden lg:flex-row">
      <div className="relative flex flex-col gap-4 border-b p-5 lg:w-[44%] lg:shrink-0 lg:border-r lg:border-b-0">
        <div className="flex items-center gap-2">
          <Trophy className="size-4 text-primary" aria-hidden />
          <span className="eyebrow">Найкраща альтернатива X*</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <AltDot color={meta.colorById.get(best.id) ?? 'var(--primary)'} className="size-3.5" />
          <h2 className="text-[28px] leading-9 font-semibold tracking-[-0.025em]">{best.name}</h2>
          <SecurityBadge level={best.securityLevel} showLabel />
        </div>
        <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
          <div>
            <div className="text-xs text-muted-foreground">Інтегральна оцінка Z*</div>
            <div className="text-[40px] leading-[44px] font-semibold tracking-[-0.03em] num">{formatFixed(zStar)}</div>
          </div>
          <div className="pb-1 text-[13px] leading-5">
            <div className="text-muted-foreground">
              Z*/Σt = <span className="font-medium text-foreground num">{formatFixed(normalizedZ(zStar, analysis))}</span>
            </div>
            <div className="text-muted-foreground num">{leadText(analysis)}</div>
          </div>
        </div>
        <div className="grid gap-1.5">
          {meta.goalLabels.map((label, index) => (
            <div key={label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-xs">
              <span className="truncate text-muted-foreground">{label}</span>
              <MiniBar value={best.goalScores[index] ?? 0} color={goalColorVar(index)} width="w-28" />
            </div>
          ))}
        </div>
      </div>
      <div className="grid flex-1 grid-rows-3 divide-y">
        <HeroStat
          label="Вектор задоволення"
          value={`T = ${formatVector(analysis.target, 1)}`}
          hint={`Σt = ${formatFixed(analysis.target.reduce((acc, value) => acc + value, 0), 1)}: максимально можливе Z*`}
        />
        <HeroStat
          label="Макс. відхилення"
          value={`m = ${formatVector(analysis.spread)}`}
          hint="Межа, після якої відхилення від T вже не штрафується"
        />
        <div className="flex min-w-0 flex-col justify-center gap-1.5 px-5 py-4">
          <div className="flex items-baseline justify-between gap-4">
            <div className="eyebrow">Критерій безпеки</div>
            <div className="text-[17px] leading-6 font-semibold whitespace-nowrap num">
              {passed} <span className="font-normal text-muted-foreground">з {total} пройшли</span>
            </div>
          </div>
          <div className="flex h-1.5 gap-[2px] overflow-hidden rounded-full" aria-hidden>
            {analysis.alternatives
              .toSorted((a, b) => b.securityLevel - a.securityLevel)
              .map((alt) => (
                <span
                  key={alt.id}
                  className="flex-1"
                  style={{ backgroundColor: alt.passesSecurity ? securityColorVar(alt.securityLevel) : 'var(--muted)' }}
                />
              ))}
          </div>
          <div className="text-xs leading-4 text-muted-foreground">
            Поріг B{project.minSecurityLevel}: {level.label.toLowerCase()}, min gᵢ ≥ {formatFixed((project.minSecurityLevel - 1) * 0.2, 1)}
          </div>
        </div>
      </div>
    </Card>
  )
}
