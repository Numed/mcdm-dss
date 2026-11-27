import { ChevronRight } from 'lucide-react'
import { type ReactNode, useMemo } from 'react'
import { FORMULAS, type FormulaId } from '@/app/formulas'
import { ROBUSTNESS_RUNS, useRobustness } from '@/app/useAnalysis'
import type { ResultMeta } from '@/app/useResultMeta'
import { criteriaCount } from '@/app/validation'
import { AltDot } from '@/components/app/AltDot'
import { MiniBar } from '@/components/app/MiniBar'
import { SecurityBadge } from '@/components/app/SecurityBadge'
import { Formula } from '@/components/app/Tex'
import { BumpChart } from '@/components/charts/BumpChart'
import { GoalSpaceChart } from '@/components/charts/GoalSpaceChart'
import { RadarChart } from '@/components/charts/RadarChart'
import { RankAcceptability } from '@/components/charts/RankAcceptability'
import { ZStarBreakdown } from '@/components/charts/ZStarBreakdown'
import type { AnalysisResult } from '@/core/analysis'
import { spearman } from '@/core/compare'
import type { Project } from '@/core/model'
import { SECURITY_LEVELS } from '@/core/security'
import { orderSensitivity, winnerGrid } from '@/core/sensitivity'
import { correlationColor, goalColorVar, securityColorVar } from '@/lib/colors'
import { formatFixed, formatNumber, formatPercent, formatVector, pluralUk } from '@/lib/utils'
import { useProjectStore } from '@/store/projectStore'

export type SlideProps = {
  project: Project
  analysis: AnalysisResult
  meta: ResultMeta
}

type SlideFrameProps = {
  kicker: string
  title: string
  lead?: ReactNode
  children: ReactNode
}

type BigStatProps = {
  label: string
  value: ReactNode
  hint?: ReactNode
}

const MATRIX_FORMULAS: FormulaId[] = ['relation', 'powerMean', 'weights', 'alternativesRelation', 'scores']

const STAGES = [
  { title: 'Дані', text: 'Матриці значень критеріїв за групами для кожної альтернативи' },
  { title: 'Функції належності', text: 'Нормування: x / max для ↑ max, min / x для ↓ min' },
  { title: 'Агрегування за групами', text: 'Метод множення матриць дає ваги критеріїв і оцінку групи' },
  { title: 'Агрегування за цілями', text: 'Той самий метод зважує групи й дає оцінку за ціллю' },
  { title: 'Критерій безпеки', text: 'Рівень B1–B5 за найслабшою ціллю, ризиковані відсіюються' },
  { title: 'Вектор задоволення', text: 'Потреби ОПР T і відхилення μ = min(m, n) для кожної цілі' },
  { title: 'Ранжування', text: 'Інтегральна оцінка Z* = Σ zᵢ·tᵢ і вибір найкращої' },
]

const PHASES = [
  { title: 'Підготовка даних', span: 2 },
  { title: 'Метод множення матриць', span: 2 },
  { title: 'Відбір і ранжування', span: 3 },
]

function SlideFrame(props: SlideFrameProps) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-8">
      <header className="flex flex-col gap-3">
        <div className="text-sm font-medium tracking-[0.06em] text-primary uppercase">{props.kicker}</div>
        <h2 className="text-[40px] leading-[48px] font-semibold tracking-[-0.03em]">{props.title}</h2>
        {props.lead && <p className="max-w-4xl text-lg leading-7 text-muted-foreground">{props.lead}</p>}
      </header>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="my-auto w-full pb-6">{props.children}</div>
      </div>
    </div>
  )
}

function BigStat(props: BigStatProps) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-card p-6">
      <div className="text-sm text-muted-foreground">{props.label}</div>
      <div className="text-[40px] leading-[44px] font-semibold tracking-[-0.03em] num">{props.value}</div>
      {props.hint && <div className="text-sm text-muted-foreground">{props.hint}</div>}
    </div>
  )
}

function nameMap(project: Project): Map<string, string> {
  return new Map(project.alternatives.map((alt) => [alt.id, alt.name]))
}

export function TitleSlide(props: SlideProps) {
  const { project } = props
  return (
    <div className="flex h-full flex-col justify-center gap-10">
      <div className="flex flex-col gap-5">
        <div className="text-sm font-medium tracking-[0.08em] text-primary uppercase">Магістерська робота</div>
        <h1 className="max-w-5xl text-[56px] leading-[64px] font-semibold tracking-[-0.035em]">
          Інформаційна технологія підтримки прийняття рішень для багатокритеріального вибору альтернатив за групами цілей
        </h1>
        <p className="text-xl text-muted-foreground">Ужгородський національний університет · кафедра програмного забезпечення систем</p>
      </div>
      <div className="flex items-center gap-3 text-[15px] text-muted-foreground">
        <span className="rounded-md border bg-card px-3 py-1.5 font-medium text-foreground">Демонстрація СППР</span>
        <span>{project.title}</span>
      </div>
    </div>
  )
}

export function TaskSlide(props: SlideProps) {
  const { project, meta } = props
  const criteria = criteriaCount(project)
  const groups = project.goals.reduce((sum, goal) => sum + goal.groups.length, 0)
  return (
    <SlideFrame
      kicker="Постановка задачі"
      title="Обрати альтернативу, що задовольняє кілька цілей одночасно"
      lead="Кожна ціль оцінюється групами кількісних критеріїв. Потрібен не просто найсильніший варіант, а той, що найкраще відповідає потребам ОПР і не провальний за жодною ціллю."
    >
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-4 gap-4">
          <BigStat label="Альтернативи" value={project.alternatives.length} />
          <BigStat label="Цілі" value={project.goals.length} />
          <BigStat label="Групи критеріїв" value={project.inputMode === 'criteria' ? groups : '—'} />
          <BigStat label="Критерії" value={project.inputMode === 'criteria' ? criteria : '—'} />
        </div>
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(Math.max(project.goals.length, 1), 3)}, minmax(0, 1fr))` }}>
          {project.goals.map((goal, goalIndex) => (
            <div
              key={goal.id}
              className="animate-slide-in flex flex-col gap-5 rounded-xl border bg-card p-6"
              style={{ animationDelay: `${goalIndex * 90}ms`, animationFillMode: 'backwards', borderTopColor: goalColorVar(goalIndex), borderTopWidth: 3 }}
            >
              <div className="flex items-center gap-3">
                <span className="rounded-md px-2 py-0.5 text-sm font-semibold num" style={{ color: goalColorVar(goalIndex), backgroundColor: `color-mix(in oklab, ${goalColorVar(goalIndex)} 14%, transparent)` }}>
                  G{goalIndex + 1}
                </span>
                <span className="text-xl font-semibold first-letter:uppercase">{meta.goalNames[goalIndex]}</span>
              </div>
              {project.inputMode === 'criteria' ? (
                <div className="flex flex-col gap-4">
                  {goal.groups.map((group) => (
                    <div key={group.id} className="flex flex-col gap-2">
                      <div className="flex items-baseline justify-between gap-3 text-[15px]">
                        <span className="font-medium">{group.name}</span>
                        <span className="shrink-0 text-sm text-muted-foreground num">
                          {group.criteria.length} {pluralUk(group.criteria.length, 'критерій', 'критерії', 'критеріїв')}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {group.criteria.map((criterion) => (
                          <span key={criterion.id} className="inline-flex items-center gap-1.5 rounded-md border bg-background/60 px-2 py-1 text-sm text-muted-foreground">
                            <span className={criterion.direction === 'benefit' ? 'text-success' : 'text-warning'} aria-label={criterion.direction === 'benefit' ? 'max' : 'min'}>
                              {criterion.direction === 'benefit' ? '↑' : '↓'}
                            </span>
                            {criterion.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[15px] text-muted-foreground">Оцінки за ціллю задано готовими значеннями.</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </SlideFrame>
  )
}

export function PipelineSlide(props: SlideProps) {
  const { project } = props
  const criteriaMode = project.inputMode === 'criteria'
  return (
    <SlideFrame
      kicker="Інформаційна технологія"
      title="Сім етапів від даних до рішення"
      lead="Ваги критеріїв обчислюються автоматично, без попарних порівнянь експертів, а ризиковані варіанти відсіюються до ранжування."
    >
      <div className="flex flex-col gap-5">
        <ol className="grid grid-cols-7 gap-6">
          {STAGES.map((stage, index) => {
            const skipped = !criteriaMode && (index === 1 || index === 2)
            return (
              <li
                key={stage.title}
                className="animate-slide-in relative flex min-h-64 flex-col gap-4 rounded-xl border bg-card p-5"
                style={{ animationDelay: `${index * 70}ms`, animationFillMode: 'backwards', opacity: skipped ? 0.45 : 1 }}
              >
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-lg font-semibold text-primary-foreground num">
                  {index + 1}
                </span>
                <span className="text-lg leading-6 font-semibold">{stage.title}</span>
                <span className="text-[15px] leading-6 text-muted-foreground">
                  {skipped ? 'Пропущено для готових оцінок' : stage.text}
                </span>
                {index < STAGES.length - 1 && (
                  <ChevronRight className="absolute top-7 -right-5 size-4 text-muted-foreground" aria-hidden />
                )}
              </li>
            )
          })}
        </ol>
        <div className="grid grid-cols-7 gap-6">
          {PHASES.map((phase, index) => (
            <div
              key={phase.title}
              className="animate-slide-in flex flex-col gap-2"
              style={{ gridColumn: `span ${phase.span}`, animationDelay: `${500 + index * 90}ms`, animationFillMode: 'backwards' }}
            >
              <div className="h-1 rounded-full bg-primary" style={{ opacity: 0.35 + index * 0.3 }} />
              <span className="text-sm font-medium text-muted-foreground">{phase.title}</span>
            </div>
          ))}
        </div>
      </div>
    </SlideFrame>
  )
}

export function MatrixSlide(props: SlideProps) {
  const { project, analysis, meta } = props
  return (
    <SlideFrame
      kicker="Етапи 2–4"
      title="Метод множення матриць"
      lead="Зв’язки між критеріями A·Aᵀ і середнє порядку t дають ваги без участі експертів. Той самий метод агрегує групи в ціль."
    >
      <div className="grid grid-cols-[1.1fr_1fr] gap-8">
        <div className="flex flex-col justify-center gap-3 rounded-xl border bg-card px-8 py-6 text-[22px]">
          {MATRIX_FORMULAS.map((id) => (
            <Formula key={id} math={FORMULAS[id].tex} number={FORMULAS[id].number} />
          ))}
        </div>
        <div className="flex flex-col justify-center gap-6 overflow-hidden rounded-xl border bg-card p-6">
          <div className="text-sm font-medium text-muted-foreground">Обчислені ваги груп і критеріїв</div>
          {project.inputMode === 'criteria' ? (
            project.goals.map((goal, goalIndex) => {
              const aggregation = analysis.goals[goalIndex]
              const groups = goal.groups.filter((group) => group.criteria.length > 0)
              return (
                <div key={goal.id} className="flex flex-col gap-3">
                  <div className="text-[15px] font-semibold">{meta.goalLabels[goalIndex]}</div>
                  {groups.map((group, groupIndex) => (
                    <div key={group.id} className="flex flex-col gap-1.5">
                      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 text-[15px]">
                        <span className="truncate font-medium">{group.name}</span>
                        <MiniBar value={aggregation?.groupWeights[groupIndex] ?? 0} color={goalColorVar(goalIndex)} width="w-40" />
                      </div>
                      {group.criteria.map((criterion, criterionIndex) => (
                        <div key={criterion.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 pl-4 text-sm text-muted-foreground">
                          <span className="truncate">{criterion.name}</span>
                          <MiniBar
                            value={aggregation?.groups[groupIndex]?.criteriaWeights[criterionIndex] ?? 0}
                            color={`color-mix(in oklab, ${goalColorVar(goalIndex)} 55%, transparent)`}
                            width="w-40"
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )
            })
          ) : (
            <p className="text-muted-foreground">У прикладі зі статті оцінки за цілями задано готовими, тож цей етап пропускається.</p>
          )}
        </div>
      </div>
    </SlideFrame>
  )
}

export function SpaceSlide(props: SlideProps) {
  const { project, analysis, meta } = props
  const setSatisfactionTerms = useProjectStore((state) => state.setSatisfactionTerms)
  const levels = analysis.alternatives.map((alt) => alt.securityLevel)
  return (
    <SlideFrame
      kicker="Етапи 5–6"
      title="Простір цілей, безпека і вектор задоволення"
      lead="Рівень безпеки визначає найслабша ціль. Точка T — потреби ОПР: її можна перетягнути просто зараз."
    >
      <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] items-center gap-8">
        <div className="rounded-xl border bg-card p-5">
          {project.goals.length === 2 && (
            <GoalSpaceChart
              alternatives={analysis.alternatives}
              colorById={meta.colorById}
              rankById={meta.rankById}
              target={analysis.target}
              goalNames={meta.goalLabels}
              minSecurityLevel={project.minSecurityLevel}
              maxPlotSize={380}
              onTargetChange={(termX, termY) => {
                const [goalX, goalY] = project.goals
                if (goalX && goalY) setSatisfactionTerms([{ goalId: goalX.id, term: termX }, { goalId: goalY.id, term: termY }])
              }}
            />
          )}
          {project.goals.length > 2 && (
            <RadarChart
              alternatives={analysis.alternatives}
              colorById={meta.colorById}
              rankById={meta.rankById}
              target={analysis.target}
              goalNames={meta.goalNames}
              maxSize={460}
            />
          )}
        </div>
        <div className="flex flex-col gap-4">
          <BigStat label="Вектор задоволення" value={`T = ${formatVector(analysis.target, 1)}`} hint={`m = ${formatVector(analysis.spread)}`} />
          <div className="flex flex-col gap-2 rounded-xl border bg-card p-5">
            {SECURITY_LEVELS.map((level) => {
              const count = levels.filter((item) => item === level.level).length
              const below = level.level < project.minSecurityLevel
              return (
                <div key={level.level} className="flex items-center gap-3 text-[15px]" style={{ opacity: below ? 0.5 : 1 }}>
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: securityColorVar(level.level) }} aria-hidden />
                  <span className="w-8 font-semibold">B{level.level}</span>
                  <span className="flex-1 text-muted-foreground">{level.label}</span>
                  <span className="font-semibold num">{count}</span>
                </div>
              )
            })}
            <div className="mt-1 border-t pt-2 text-sm text-muted-foreground">
              Поріг B{project.minSecurityLevel}: допущено {analysis.ranking.length} з {analysis.alternatives.length}
            </div>
          </div>
        </div>
      </div>
    </SlideFrame>
  )
}

export function RankingSlide(props: SlideProps) {
  const { analysis, meta } = props
  const best = analysis.best
  return (
    <SlideFrame kicker="Етап 7" title="Ранжування за близькістю до потреб ОПР" lead="Z* = Σ zₗ·tₗ: компоненти T одночасно задають бажаний рівень і вагу кожної цілі.">
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] items-center gap-8">
        {best ? (
          <div className="flex flex-col gap-5 rounded-xl border border-primary/40 bg-card p-8">
            <div className="text-sm font-medium tracking-[0.06em] text-primary uppercase">Найкраща альтернатива</div>
            <div className="flex items-center gap-4">
              <AltDot color={meta.colorById.get(best.id) ?? 'var(--primary)'} className="size-5" />
              <span className="text-[52px] leading-[56px] font-semibold tracking-[-0.03em]">{best.name}</span>
            </div>
            <SecurityBadge level={best.securityLevel} showLabel className="h-8 px-2.5 text-sm" />
            <div className="text-[64px] leading-[64px] font-semibold tracking-[-0.04em] num">{formatFixed(best.satisfaction?.zStar ?? 0)}</div>
            <div className="text-[15px] text-muted-foreground">Інтегральна оцінка Z* з максимально можливих {formatNumber(analysis.target.reduce((a, b) => a + b, 0), 1)}</div>
          </div>
        ) : (
          <BigStat label="Найкраща альтернатива" value="немає" hint="жодна не пройшла поріг безпеки" />
        )}
        <div className="rounded-xl border bg-card p-6 text-[15px]">
          <ZStarBreakdown
            ranking={analysis.ranking}
            colorById={meta.colorById}
            rankById={meta.rankById}
            target={analysis.target}
            goalNames={meta.goalNames}
          />
        </div>
      </div>
    </SlideFrame>
  )
}

export function RobustnessSlide(props: SlideProps) {
  const { project, analysis, meta } = props
  const result = useRobustness(0.1)
  const nameById = nameMap(project)
  const winner = analysis.best
  return (
    <SlideFrame
      kicker="Стійкість рішення"
      title="Що, якщо дані неточні?"
      lead={`Метод Монте-Карло: ${ROBUSTNESS_RUNS} сценаріїв, у кожному всі вхідні значення випадково змінено на ±10 %.`}
    >
      <div className="grid grid-cols-[22rem_minmax(0,1fr)] items-center gap-8">
        <BigStat
          label="Переможець зберігається"
          value={<span className="text-[72px] leading-[76px]">{formatPercent(result.baselineWinRate)}</span>}
          hint={winner ? `«${winner.name}» перемагає в ${Math.round(result.baselineWinRate * ROBUSTNESS_RUNS)} з ${ROBUSTNESS_RUNS} сценаріїв` : undefined}
        />
        <div className="rounded-xl border bg-card p-6">
          <RankAcceptability result={result} nameById={nameById} colorById={meta.colorById} />
        </div>
      </div>
    </SlideFrame>
  )
}

export function CompareSlide(props: SlideProps) {
  const { project, analysis, meta } = props
  const comparison = analysis.comparison
  const nameById = nameMap(project)
  if (!comparison) {
    return (
      <SlideFrame kicker="Порівняння" title="Порівняння з TOPSIS і VIKOR" lead="Доступне для проєктів з матрицями критеріїв.">
        <div />
      </SlideFrame>
    )
  }
  const [, topsisMethod, vikorMethod] = comparison.methods
  const pairs = [
    { label: 'з TOPSIS', value: topsisMethod?.correlation ?? 0 },
    { label: 'з VIKOR', value: vikorMethod?.correlation ?? 0 },
    { label: 'TOPSIS ↔ VIKOR', value: topsisMethod && vikorMethod ? spearman(topsisMethod.ranks, vikorMethod.ranks) : 0 },
  ]
  return (
    <SlideFrame
      kicker="Порівняння"
      title="Чим метод відрізняється від TOPSIS і VIKOR"
      lead="TOPSIS і VIKOR максимізують показники. Запропонований метод винагороджує відповідність потребам ОПР, тому ранжування можуть розходитися."
    >
      <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] items-center gap-8">
        <div className="rounded-xl border bg-card p-6">
          <BumpChart
            ariaLabel="Ранги за трьома методами"
            columns={['Запропонований', 'TOPSIS', 'VIKOR'].map((label) => ({ key: label, label }))}
            series={comparison.alternativeIds.map((id, index) => ({
              id,
              label: nameById.get(id) ?? id,
              color: meta.colorById.get(id) ?? 'var(--primary)',
              ranks: comparison.methods.map((method) => method.ranks[index] ?? null),
            }))}
            highlightColumn={0}
          />
        </div>
        <div className="flex flex-col gap-4">
          {pairs.map((pair) => (
            <BigStat
              key={pair.label}
              label={`ρ Спірмена ${pair.label}`}
              value={<span style={{ color: correlationColor(pair.value) }}>{formatFixed(pair.value)}</span>}
            />
          ))}
        </div>
      </div>
    </SlideFrame>
  )
}

export function ConclusionSlide(props: SlideProps) {
  const { project, analysis } = props
  const robustness = useRobustness(0.1)
  const best = analysis.best
  const nameById = nameMap(project)
  const byOrder = useMemo(() => (project.inputMode === 'criteria' ? orderSensitivity(project) : []), [project])
  const grid = useMemo(() => (project.goals.length >= 2 ? winnerGrid(project) : []), [project])
  const stableOrder = byOrder.length > 0 && new Set(byOrder.map((item) => item.bestId)).size === 1
  const leaderCells = best ? grid.filter((cell) => cell.bestId === best.id && cell.tiedIds.length <= 1).length : 0
  const topsis = analysis.comparison?.methods[1]
  const points = [
    best
      ? `Найкраща альтернатива — «${best.name}» з Z* = ${formatFixed(best.satisfaction?.zStar ?? 0)} і рівнем безпеки B${best.securityLevel}.`
      : 'Жодна альтернатива не пройшла критерій безпеки.',
    `За похибки даних ±10 % переможець зберігається в ${formatPercent(robustness.baselineWinRate)} сценаріїв.`,
    byOrder.length > 0 &&
      (stableOrder
        ? 'Вибір не залежить від порядку середнього t у методі множення матриць.'
        : `Переможець змінюється залежно від t: ${[...new Set(byOrder.map((item) => nameById.get(item.bestId ?? '') ?? '—'))].join(', ')}.`),
    best && grid.length > 0 && `«${best.name}» перемагає в ${leaderCells} з 36 комбінацій термів вектора задоволення.`,
    topsis && `Кореляція Спірмена з TOPSIS ρ = ${formatFixed(topsis.correlation)}: метод враховує потреби ОПР, а не лише абсолютні показники.`,
  ].filter((point): point is string => typeof point === 'string')

  return (
    <SlideFrame kicker="Висновки" title="Результати демонстрації">
      <ul className="flex max-w-5xl flex-col gap-5">
        {points.map((point, index) => (
          <li
            key={point}
            className="animate-slide-in flex gap-5 text-[22px] leading-8"
            style={{ animationDelay: `${index * 90}ms`, animationFillMode: 'backwards' }}
          >
            <span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-base font-semibold text-primary-foreground num">
              {index + 1}
            </span>
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </SlideFrame>
  )
}
