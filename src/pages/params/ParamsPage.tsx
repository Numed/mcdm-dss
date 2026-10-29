import { Trophy } from 'lucide-react'
import { useMemo } from 'react'
import { analyzeCached, useAnalysis } from '@/app/useAnalysis'
import { useResultMeta } from '@/app/useResultMeta'
import { AltDot } from '@/components/app/AltDot'
import { PageHeader } from '@/components/app/PageHeader'
import { type RadioCardOption, RadioCardGroup } from '@/components/app/RadioCard'
import { Tex } from '@/components/app/Tex'
import { GoalSpaceChart } from '@/components/charts/GoalSpaceChart'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import type { AlternativeResult } from '@/core/analysis'
import type { GoalNormalization } from '@/core/goals'
import type { PowerMeanOrder } from '@/core/matrixMethod'
import type { Project } from '@/core/model'
import { SATISFACTION_TERMS } from '@/core/satisfaction'
import { SECURITY_LEVELS, type SecurityLevel } from '@/core/security'
import { securityColorVar } from '@/lib/colors'
import { cn, formatFixed, formatNumber, formatVector, pluralUk } from '@/lib/utils'
import { useProjectStore } from '@/store/projectStore'

type WinnerTagProps = {
  winner: AlternativeResult | null
  current: boolean
  colorById: Map<string, string>
}

type SecurityScaleProps = {
  project: Project
  levels: SecurityLevel[]
  onSelect: (level: SecurityLevel) => void
}

const ORDERS: PowerMeanOrder[] = [-1, 0, 1, 2]
const NORMALIZATIONS: GoalNormalization[] = ['max', 'sum']

const ORDER_TEXT: Record<PowerMeanOrder, { title: string; description: string }> = {
  [-1]: { title: 'Гармонійне, t = −1', description: 'Найбільш песимістичне: слабкі зв’язки між критеріями сильно знижують вагу.' },
  0: { title: 'Геометричне, t = 0', description: 'Компроміс: чутливе до малих значень, але менш різке за гармонійне.' },
  1: { title: 'Арифметичне, t = 1', description: 'Базовий варіант зі статті: усі зв’язки між критеріями рівноцінні.' },
  2: { title: 'Квадратичне, t = 2', description: 'Оптимістичне: посилює вплив найсильніших зв’язків між критеріями.' },
}

const NORMALIZATION_TEXT: Record<GoalNormalization, { title: string; description: string }> = {
  max: {
    title: 'Відносно найкращої, max = 1',
    description: 'Оцінки за ціллю в шкалі [0; 1], співставній з рівнями безпеки та вектором задоволення. Рекомендовано.',
  },
  sum: {
    title: 'Сума оцінок дорівнює 1',
    description: 'Класичний вихід методу множення матриць. Оцінки малі, тому більшість альтернатив падає в B1.',
  },
}

function WinnerTag(props: WinnerTagProps) {
  const { winner, current, colorById } = props
  if (!winner) return <span>немає допустимих</span>
  return (
    <span className={cn('inline-flex items-center gap-1.5', current && 'font-medium text-foreground')}>
      <Trophy className="size-3" aria-hidden />
      <AltDot color={colorById.get(winner.id) ?? 'var(--primary)'} className="size-2" />
      {winner.name}
    </span>
  )
}

function SecurityScale(props: SecurityScaleProps) {
  const { project, levels, onSelect } = props
  const selected = project.minSecurityLevel
  return (
    <div className="flex flex-col gap-3">
      <div role="radiogroup" aria-label="Поріг безпеки" className="grid grid-cols-5 gap-1.5">
        {SECURITY_LEVELS.map((item) => {
          const count = levels.filter((level) => level === item.level).length
          const excluded = levels.filter((level) => level < item.level).length
          const active = item.level === selected
          const below = item.level < selected
          const color = securityColorVar(item.level)
          return (
            <button
              key={item.level}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onSelect(item.level)}
              className={cn(
                'group flex cursor-pointer flex-col gap-2 rounded-lg border p-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50',
                active ? 'border-foreground/40 ring-1 ring-foreground/30' : 'hover:border-foreground/20',
                below && 'bg-muted/40',
              )}
            >
              <span className="h-1.5 rounded-full" style={{ backgroundColor: color, opacity: below ? 0.3 : 1 }} aria-hidden />
              <span className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-semibold">B{item.level}</span>
                <span className="text-xs text-muted-foreground num">{item.range}</span>
              </span>
              <span className="line-clamp-1 text-xs text-muted-foreground">{item.label}</span>
              <span className="flex items-end justify-between gap-2 border-t pt-2">
                <span className="text-xs text-muted-foreground">
                  <span className="text-[15px] font-semibold text-foreground num">{count}</span> на рівні
                </span>
                <span className={cn('text-xs num', excluded > 0 ? 'text-destructive' : 'text-muted-foreground')}>
                  {excluded > 0 ? `−${excluded}` : '0'}
                </span>
              </span>
            </button>
          )
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        Число праворуч показує, скільки альтернатив відсіється, якщо обрати цей рівень порогом. Рівень альтернативи
        визначається найслабшою з її оцінок за цілями.
      </p>
    </div>
  )
}

export function ParamsPage() {
  const project = useProjectStore((state) => state.project)
  const setSatisfactionTerm = useProjectStore((state) => state.setSatisfactionTerm)
  const setMinSecurityLevel = useProjectStore((state) => state.setMinSecurityLevel)
  const setPowerMeanOrder = useProjectStore((state) => state.setPowerMeanOrder)
  const setGoalNormalization = useProjectStore((state) => state.setGoalNormalization)
  const analysis = useAnalysis()
  const meta = useResultMeta(project, analysis)
  const criteriaMode = project.inputMode === 'criteria'
  const excluded = analysis.alternatives.filter((alt) => !alt.passesSecurity)

  const winners = useMemo(() => {
    const byOrder = new Map(ORDERS.map((order) => [order, analyzeCached({ ...project, powerMeanOrder: order }).best]))
    const byNormalization = new Map(
      NORMALIZATIONS.map((normalization) => [
        normalization,
        analyzeCached({ ...project, goalNormalization: normalization }).best,
      ]),
    )
    return { byOrder, byNormalization }
  }, [project])

  const orderOptions: RadioCardOption<string>[] = ORDERS.map((order) => ({
    value: String(order),
    title: ORDER_TEXT[order].title,
    description: ORDER_TEXT[order].description,
    aside: (
      <WinnerTag
        winner={winners.byOrder.get(order) ?? null}
        current={order === project.powerMeanOrder}
        colorById={meta.colorById}
      />
    ),
  }))

  const normalizationOptions: RadioCardOption<GoalNormalization>[] = NORMALIZATIONS.map((normalization) => ({
    value: normalization,
    title: NORMALIZATION_TEXT[normalization].title,
    description: NORMALIZATION_TEXT[normalization].description,
    aside: (
      <WinnerTag
        winner={winners.byNormalization.get(normalization) ?? null}
        current={normalization === project.goalNormalization}
        colorById={meta.colorById}
      />
    ),
  }))

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Параметри"
        description="Вектор задоволення, критерій безпеки та налаштування методу множення матриць. Результати перераховуються одразу."
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Вектор задоволення T</CardTitle>
                <CardDescription>
                  Уявна альтернатива, яка влаштувала б особу, що приймає рішення. Задається лінгвістично за правилом «якщо
                  потреба за ціллю Gₗ = a, то tₗ = u» і одночасно визначає вагу цілі.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col divide-y">
              {project.goals.map((goal, goalIndex) => {
                const term = SATISFACTION_TERMS[goal.satisfactionTerm]
                return (
                  <div key={goal.id} className="flex flex-col gap-4 py-5 first:pt-1 last:pb-0">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div className="flex min-w-0 items-baseline gap-2">
                        <span className="text-xs font-semibold text-primary num">G{goalIndex + 1}</span>
                        <span className="truncate text-[13px] font-medium">{meta.goalNames[goalIndex]}</span>
                      </div>
                      <div className="text-[13px]">
                        <span className="text-muted-foreground">{term?.label}</span>
                        <span className="ml-2 font-semibold num">
                          t{goalIndex + 1} = {formatNumber(term?.value ?? 0, 1)}
                        </span>
                      </div>
                    </div>
                    <div className="px-2">
                      <Slider
                        min={0}
                        max={SATISFACTION_TERMS.length - 1}
                        step={1}
                        value={[goal.satisfactionTerm]}
                        onValueChange={([value]) => setSatisfactionTerm(goal.id, value ?? 0)}
                        thumbLabel={`Потреба за ціллю G${goalIndex + 1}`}
                        aria-valuetext={term?.label}
                      />
                      <div className="relative mt-2 h-11">
                        {SATISFACTION_TERMS.map((item, termIndex) => {
                          const position = (termIndex / (SATISFACTION_TERMS.length - 1)) * 100
                          const active = termIndex === goal.satisfactionTerm
                          return (
                            <button
                              key={item.label}
                              type="button"
                              tabIndex={-1}
                              onClick={() => setSatisfactionTerm(goal.id, termIndex)}
                              className={cn(
                                'absolute top-0 flex w-28 -translate-x-1/2 cursor-pointer flex-col items-center gap-0.5 text-center text-[11px] leading-3.5 text-muted-foreground hover:text-foreground',
                                termIndex === 0 && 'translate-x-[-12%] items-start text-left',
                                termIndex === SATISFACTION_TERMS.length - 1 && 'translate-x-[-88%] items-end text-right',
                                active && 'font-medium text-foreground',
                              )}
                              style={{ left: `${position}%` }}
                            >
                              <span className="num">{formatNumber(item.value, 1)}</span>
                              <span className="line-clamp-2">{item.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Критерій безпеки вибору</CardTitle>
                <CardDescription>
                  Альтернативи з рівнем нижче порогу відсіюються до ранжування. Обрано B{project.minSecurityLevel}:
                  допускаються <Tex math={`\\min_l g_{il} \\ge ${formatNumber((project.minSecurityLevel - 1) * 0.2, 1).replace(',', '{,}')}`} />.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <SecurityScale
                project={project}
                levels={analysis.alternatives.map((alt) => alt.securityLevel)}
                onSelect={setMinSecurityLevel}
              />
            </CardContent>
          </Card>

          <Card className={cn(!criteriaMode && 'opacity-70')}>
            <CardHeader>
              <div>
                <CardTitle>Метод множення матриць</CardTitle>
                <CardDescription>
                  {criteriaMode
                    ? 'Порядок середнього для важливості критеріїв і нормування вектора оцінок за ціллю. Праворуч переможець за кожного варіанта.'
                    : 'Не використовується в режимі готових оцінок за цілями.'}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <section className="flex flex-col gap-3">
                <h4 className="eyebrow">
                  Середнє порядку <span className="normal-case">t</span>
                </h4>
                <RadioCardGroup
                  name="Середнє порядку t"
                  value={String(project.powerMeanOrder)}
                  options={orderOptions}
                  disabled={!criteriaMode}
                  onChange={(value) => {
                    const order = ORDERS.find((item) => String(item) === value)
                    if (order !== undefined) setPowerMeanOrder(order)
                  }}
                />
              </section>
              <section className="flex flex-col gap-3">
                <h4 className="eyebrow">Нормування оцінок за ціллю</h4>
                <RadioCardGroup
                  name="Нормування оцінок за ціллю"
                  value={project.goalNormalization}
                  options={normalizationOptions}
                  disabled={!criteriaMode}
                  onChange={setGoalNormalization}
                />
              </section>
            </CardContent>
          </Card>
        </div>

        <Card className="xl:sticky xl:top-20">
          <CardHeader className="border-b">
            <div className="flex w-full flex-col gap-3">
              <div className="eyebrow">Живий перегляд</div>
              <div className="text-[26px] leading-8 font-semibold tracking-[-0.02em] num">T = {formatVector(analysis.target, 1)}</div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>
                  Σt = <span className="font-medium text-foreground num">{formatNumber(analysis.target.reduce((a, b) => a + b, 0), 1)}</span>
                </span>
                <span>
                  m = <span className="font-medium text-foreground num">{formatVector(analysis.spread)}</span>
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pt-4">
            {project.goals.length === 2 && (
              <GoalSpaceChart
                alternatives={analysis.alternatives}
                colorById={meta.colorById}
                rankById={meta.rankById}
                target={analysis.target}
                goalNames={meta.goalLabels.map((_, index) => `G${index + 1}`)}
                minSecurityLevel={project.minSecurityLevel}
                maxPlotSize={268}
              />
            )}
            <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2.5 text-[13px]">
              <span className="text-muted-foreground">Переможець</span>
              {analysis.best ? (
                <span className="flex items-center gap-2 font-semibold">
                  <AltDot color={meta.colorById.get(analysis.best.id) ?? 'var(--primary)'} />
                  {analysis.best.name}
                  <span className="font-normal text-muted-foreground num">Z* = {formatFixed(analysis.best.satisfaction?.zStar ?? 0)}</span>
                </span>
              ) : (
                <span className="text-destructive">немає допустимих</span>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              Допущено {analysis.ranking.length} з {analysis.alternatives.length}
              {excluded.length > 0 &&
                `, відсіяно ${excluded.length} ${pluralUk(excluded.length, 'альтернативу', 'альтернативи', 'альтернатив')}: ${excluded.map((alt) => alt.name).join(', ')}`}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
