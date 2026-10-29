import { useMemo } from 'react'
import { useAnalysis } from '@/app/useAnalysis'
import { useResultMeta } from '@/app/useResultMeta'
import { AltDot } from '@/components/app/AltDot'
import { Callout } from '@/components/app/Callout'
import { PageHeader } from '@/components/app/PageHeader'
import { BumpChart, type BumpSeries } from '@/components/charts/BumpChart'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { Project } from '@/core/model'
import { SATISFACTION_TERMS } from '@/core/satisfaction'
import { SECURITY_LEVELS } from '@/core/security'
import { orderSensitivity, thresholdSensitivity, winnerGrid, type WinnerCell } from '@/core/sensitivity'
import { securityColorVar } from '@/lib/colors'
import { cn, formatFixed, formatNumber, pluralUk } from '@/lib/utils'
import { useProjectStore } from '@/store/projectStore'

type HeatmapProps = {
  project: Project
  cells: WinnerCell[]
  colorById: Map<string, string>
  nameById: Map<string, string>
  goalLabels: string[]
}

type WinnerShare = {
  id: string
  count: number
}

function winnerShares(cells: WinnerCell[]): WinnerShare[] {
  const counts = new Map<string, number>()
  cells.forEach((cell) => {
    if (cell.bestId && cell.tiedIds.length <= 1) counts.set(cell.bestId, (counts.get(cell.bestId) ?? 0) + 1)
  })
  return [...counts.entries()].map(([id, count]) => ({ id, count })).sort((a, b) => b.count - a.count)
}

function cellBackground(cell: WinnerCell, colorById: Map<string, string>): string {
  if (!cell.bestId) return 'var(--muted)'
  if (cell.tiedIds.length > 1) {
    const [first, second] = cell.tiedIds
    const a = colorById.get(first) ?? 'var(--primary)'
    const b = colorById.get(second ?? first) ?? 'var(--primary)'
    return `repeating-linear-gradient(135deg, color-mix(in srgb, ${a} 30%, var(--card)) 0 6px, color-mix(in srgb, ${b} 30%, var(--card)) 6px 12px)`
  }
  return `color-mix(in srgb, ${colorById.get(cell.bestId) ?? 'var(--primary)'} 26%, var(--card))`
}

function Heatmap(props: HeatmapProps) {
  const { project, cells, colorById, nameById, goalLabels } = props
  const setSatisfactionTerm = useProjectStore((state) => state.setSatisfactionTerm)
  const [goalX, goalY] = project.goals
  const terms = SATISFACTION_TERMS.map((term, index) => ({ ...term, index }))
  const rows = [...terms].reverse()

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-[3.5rem_repeat(6,minmax(0,1fr))] gap-1">
        {rows.map((termY) => (
          <div key={termY.label} className="contents">
            <div className="flex items-center justify-end pr-2 text-xs text-muted-foreground num" title={termY.label}>
              {formatNumber(termY.value, 1)}
            </div>
            {terms.map((termX) => {
              const cell = cells.find((item) => item.termX === termX.index && item.termY === termY.index)
              if (!cell) return <div key={termX.label} />
              const current = goalX?.satisfactionTerm === termX.index && goalY?.satisfactionTerm === termY.index
              const label = cell.bestId ? (nameById.get(cell.bestId) ?? '') : 'немає'
              const tieText = cell.tiedIds.length > 1 ? cell.tiedIds.map((id) => nameById.get(id)).join(' = ') : label
              return (
                <button
                  key={termX.label}
                  type="button"
                  onClick={() => {
                    if (goalX) setSatisfactionTerm(goalX.id, termX.index)
                    if (goalY) setSatisfactionTerm(goalY.id, termY.index)
                  }}
                  title={`t₁ = ${formatNumber(termX.value, 1)}, t₂ = ${formatNumber(termY.value, 1)}: ${tieText}, Z* = ${formatFixed(cell.zStar)}. Натисніть, щоб застосувати`}
                  aria-label={`t1 ${formatNumber(termX.value, 1)}, t2 ${formatNumber(termY.value, 1)}: ${tieText}`}
                  className={cn(
                    'flex h-14 min-w-0 cursor-pointer flex-col items-start justify-between rounded-md px-2 py-1.5 text-left outline-none transition-[box-shadow] hover:ring-2 hover:ring-foreground/25 focus-visible:ring-2 focus-visible:ring-ring',
                    current && 'ring-2 ring-foreground',
                  )}
                  style={{ background: cellBackground(cell, colorById) }}
                >
                  <span className="flex w-full min-w-0 items-center gap-1.5 text-[11px] font-medium">
                    {cell.bestId && <AltDot color={colorById.get(cell.bestId) ?? 'var(--primary)'} className="size-2" />}
                    <span className="truncate">{cell.tiedIds.length > 1 ? `${cell.tiedIds.length} рівні` : label}</span>
                  </span>
                  <span className="text-[10px] text-muted-foreground num">{cell.bestId ? formatFixed(cell.zStar) : '—'}</span>
                </button>
              )
            })}
          </div>
        ))}
        <div />
        {terms.map((termX) => (
          <div key={termX.label} className="pt-1 text-center text-xs text-muted-foreground num" title={termX.label}>
            {formatNumber(termX.value, 1)}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap justify-between gap-2 pl-14 text-xs text-muted-foreground">
        <span>
          По горизонталі: <span className="font-medium text-foreground">t₁</span> · {goalLabels[0]}
        </span>
        <span>
          По вертикалі: <span className="font-medium text-foreground">t₂</span> · {goalLabels[1]}
        </span>
      </div>
    </div>
  )
}

export function SensitivityPage() {
  const project = useProjectStore((state) => state.project)
  const analysis = useAnalysis()
  const meta = useResultMeta(project, analysis)
  const nameById = useMemo(() => new Map(project.alternatives.map((alt) => [alt.id, alt.name])), [project.alternatives])
  const criteriaMode = project.inputMode === 'criteria'

  const byOrder = useMemo(() => (criteriaMode ? orderSensitivity(project) : []), [project, criteriaMode])
  const grid = useMemo(() => (project.goals.length >= 2 ? winnerGrid(project) : []), [project])
  const byThreshold = useMemo(() => thresholdSensitivity(project), [project])
  const shares = winnerShares(grid)
  const maxAdmissible = Math.max(project.alternatives.length, 1)

  const bumpSeries: BumpSeries[] = project.alternatives.map((alt, index) => ({
    id: alt.id,
    label: alt.name,
    color: meta.colorById.get(alt.id) ?? 'var(--primary)',
    ranks: byOrder.map((item) => item.ranks[index] ?? null),
  }))
  const orderWinners = new Set(byOrder.map((item) => item.bestId))
  const stableCount = project.alternatives.filter((_, index) => new Set(byOrder.map((item) => item.ranks[index])).size === 1).length
  const currentOrderIndex = byOrder.findIndex((item) => item.order === project.powerMeanOrder)
  const leader = shares[0]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Аналіз чутливості"
        description="Наскільки стійке рішення до зміни параметрів методу: порядку середнього t, термів вектора задоволення і порогу безпеки."
      />

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Ранги за різних порядків середнього t</CardTitle>
            <CardDescription>Як змінюється ранжувальний ряд, якщо важливість критеріїв рахувати іншим середнім.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {criteriaMode ? (
            <>
              <BumpChart
                ariaLabel="Ранги альтернатив за різних t"
                columns={byOrder.map((item) => ({
                  key: String(item.order),
                  label: `t = ${item.order}`,
                  sublabel: ['гармонійне', 'геометричне', 'арифметичне', 'квадратичне'][item.order + 1],
                }))}
                series={bumpSeries}
                highlightColumn={currentOrderIndex >= 0 ? currentOrderIndex : undefined}
              />
              <Callout title="Висновок">
                {orderWinners.size === 1
                  ? `Переможець не залежить від t: за всіх чотирьох середніх найкраща «${nameById.get([...orderWinners][0] ?? '') ?? '—'}».`
                  : `Переможець змінюється залежно від t (${orderWinners.size} різних лідери), тож вибір середнього суттєвий.`}{' '}
                Стабільний ранг мають {stableCount} з {project.alternatives.length}{' '}
                {pluralUk(project.alternatives.length, 'альтернативи', 'альтернатив', 'альтернатив')}.
              </Callout>
            </>
          ) : (
            <Callout>Порядок середнього t використовується лише в режимі матриць критеріїв. Для готових оцінок за цілями ранги від t не залежать.</Callout>
          )}
        </CardContent>
      </Card>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Переможець для кожної комбінації термів</CardTitle>
              <CardDescription>
                36 варіантів вектора задоволення T = (t₁; t₂). Рамкою позначено поточний. Клік по клітинці застосовує ці терми.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {grid.length > 0 ? (
              <>
                <Heatmap project={project} cells={grid} colorById={meta.colorById} nameById={nameById} goalLabels={meta.goalLabels} />
                <ul className="flex flex-wrap gap-x-4 gap-y-1.5 border-t pt-3 text-xs">
                  {shares.map((share) => (
                    <li key={share.id} className="flex items-center gap-1.5">
                      <AltDot color={meta.colorById.get(share.id) ?? 'var(--primary)'} />
                      <span className="font-medium">{nameById.get(share.id)}</span>
                      <span className="text-muted-foreground num">{share.count} з 36</span>
                    </li>
                  ))}
                </ul>
                {project.goals.length > 2 && (
                  <p className="text-xs text-muted-foreground">Для третьої і наступних цілей терми зафіксовано на поточних значеннях.</p>
                )}
              </>
            ) : (
              <Callout>Для теплової карти потрібно щонайменше дві цілі.</Callout>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Поріг безпеки</CardTitle>
                <CardDescription>Скільки альтернатив лишається допустимими і хто перемагає за кожного порогу.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-2">
                {byThreshold.map((item) => {
                  const current = item.level === project.minSecurityLevel
                  return (
                    <li
                      key={item.level}
                      className={cn(
                        'grid grid-cols-[2.25rem_minmax(0,1fr)_7.5rem] items-center gap-3 rounded-md px-2 py-1.5 text-[13px]',
                        current && 'bg-primary/[0.06] ring-1 ring-primary/30',
                      )}
                    >
                      <span className="flex items-center gap-1.5 font-semibold">
                        <span className="size-2 rounded-full" style={{ backgroundColor: securityColorVar(item.level) }} aria-hidden />B
                        {item.level}
                      </span>
                      <div className="flex items-center gap-2" title={SECURITY_LEVELS[item.level - 1].label}>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary/70"
                            style={{ width: `${(item.admissible / maxAdmissible) * 100}%` }}
                          />
                        </div>
                        <span className="w-8 text-right text-xs num">
                          {item.admissible}/{project.alternatives.length}
                        </span>
                      </div>
                      <span className="flex min-w-0 items-center gap-1.5 text-xs">
                        {item.bestId ? (
                          <>
                            <AltDot color={meta.colorById.get(item.bestId) ?? 'var(--primary)'} className="size-2" />
                            <span className="truncate">{nameById.get(item.bestId)}</span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">немає</span>
                        )}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </CardContent>
          </Card>
          {leader && (
            <Callout title="Висновок за вектором задоволення">
              «{nameById.get(leader.id)}» перемагає в {leader.count} з 36 комбінацій термів (
              {formatNumber((leader.count / 36) * 100, 0)} %).{' '}
              {shares.length > 1
                ? `Загалом лідерами стають ${shares.length} ${pluralUk(shares.length, 'альтернатива', 'альтернативи', 'альтернатив')}, тому вибір залежить від пріоритетів ОПР.`
                : 'Рішення не залежить від пріоритетів ОПР.'}
            </Callout>
          )}
        </div>
      </div>
    </div>
  )
}
