import { ClipboardCopy, GitCompareArrows } from 'lucide-react'
import { copyTableForWord } from '@/app/exportResults'
import { comparisonTable } from '@/app/resultTables'
import { routeHref } from '@/app/routes'
import { useAnalysis } from '@/app/useAnalysis'
import { useResultMeta } from '@/app/useResultMeta'
import { AltDot } from '@/components/app/AltDot'
import { Callout } from '@/components/app/Callout'
import { EmptyState } from '@/components/app/EmptyState'
import { PageHeader } from '@/components/app/PageHeader'
import { BumpChart } from '@/components/charts/BumpChart'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { spearman } from '@/core/compare'
import type { MethodRanking } from '@/core/compareProject'
import { correlationColor } from '@/lib/colors'
import { cn, formatFixed } from '@/lib/utils'
import { useProjectStore } from '@/store/projectStore'

type MethodColumnProps = {
  title: string
  subtitle: string
  method: MethodRanking
  ids: string[]
  nameById: Map<string, string>
  colorById: Map<string, string>
  primary?: boolean
}

type CorrelationCardProps = {
  title: string
  value: number
}

const METHOD_META = [
  { title: 'Запропонований', subtitle: 'Z*, близькість до T · більше — краще' },
  { title: 'TOPSIS', subtitle: 'C, близькість до ідеалу · більше — краще' },
  { title: 'VIKOR', subtitle: 'Q, компромісний індекс · менше — краще' },
]

function agreementText(value: number): string {
  const magnitude = Math.abs(value)
  if (value < 0 && magnitude >= 0.4) return 'Ранжування протилежні'
  if (magnitude >= 0.9) return 'Дуже висока узгодженість'
  if (magnitude >= 0.7) return 'Висока узгодженість'
  if (magnitude >= 0.4) return 'Помірна узгодженість'
  return 'Слабкий зв’язок'
}

function MethodColumn(props: MethodColumnProps) {
  const { title, subtitle, method, ids, nameById, colorById, primary } = props
  const order = ids.map((id, index) => ({ id, rank: method.ranks[index], score: method.scores[index] })).sort((a, b) => a.rank - b.rank)
  return (
    <Card className={cn(primary && 'border-primary/40')}>
      <CardHeader className="border-b pb-3">
        <div className="min-w-0">
          <CardTitle className={cn(primary && 'text-primary')}>{title}</CardTitle>
          <CardDescription>{subtitle}</CardDescription>
        </div>
      </CardHeader>
      <ol className="flex flex-col py-1">
        {order.map((item) => (
          <li key={item.id} className="grid grid-cols-[1.75rem_minmax(0,1fr)_auto] items-center gap-2 px-5 py-2 text-[13px]">
            <span
              className={cn(
                'flex size-6 items-center justify-center rounded-md text-xs font-semibold num',
                item.rank === 1 ? 'bg-primary text-primary-foreground' : 'bg-muted',
              )}
            >
              {item.rank}
            </span>
            <span className="flex min-w-0 items-center gap-2">
              <AltDot color={colorById.get(item.id) ?? 'var(--primary)'} />
              <span className="truncate font-medium">{nameById.get(item.id)}</span>
            </span>
            <span className="text-muted-foreground num">{formatFixed(item.score)}</span>
          </li>
        ))}
      </ol>
    </Card>
  )
}

function CorrelationCard(props: CorrelationCardProps) {
  const { title, value } = props
  const position = ((Math.min(Math.max(value, -1), 1) + 1) / 2) * 100
  return (
    <Card className="p-5">
      <div className="text-[13px] font-medium">{title}</div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-[32px] leading-10 font-semibold tracking-[-0.02em] num" style={{ color: correlationColor(value) }}>
          {formatFixed(value)}
        </span>
        <span className="text-xs text-muted-foreground">ρ Спірмена</span>
      </div>
      <div className="mt-1 text-[13px] font-medium">{agreementText(value)}</div>
      <div className="relative mt-4">
        <div
          className="h-2 rounded-full"
          style={{ background: 'linear-gradient(90deg, var(--corr-neg), var(--corr-mid) 50%, var(--corr-pos))' }}
          aria-hidden
        />
        <div
          className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-foreground shadow"
          style={{ left: `${position}%` }}
          aria-hidden
        />
        <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground num">
          <span>−1</span>
          <span>0</span>
          <span>1</span>
        </div>
      </div>
    </Card>
  )
}

export function ComparePage() {
  const project = useProjectStore((state) => state.project)
  const analysis = useAnalysis()
  const meta = useResultMeta(project, analysis)
  const comparison = analysis.comparison
  const nameById = new Map(project.alternatives.map((alt) => [alt.id, alt.name]))

  if (!comparison) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Порівняння методів" />
        <Card>
          <EmptyState
            icon={GitCompareArrows}
            title="Порівняння недоступне"
            description="TOPSIS і VIKOR застосовуються до тих самих функцій належності, тому потрібен режим матриць критеріїв і щонайменше дві альтернативи, що пройшли критерій безпеки."
            action={
              <Button asChild size="sm" variant="outline">
                <a href={routeHref('goals')}>Перейти до цілей і критеріїв</a>
              </Button>
            }
          />
        </Card>
      </div>
    )
  }

  const [proposed, topsisMethod, vikorMethod] = comparison.methods
  const topsisVikor = topsisMethod && vikorMethod ? spearman(topsisMethod.ranks, vikorMethod.ranks) : 0
  const table = comparisonTable(project, analysis)
  const sameWinner = new Set(comparison.methods.map((method) => comparison.alternativeIds[method.ranks.indexOf(1)])).size === 1

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Порівняння методів"
        description="TOPSIS і VIKOR застосовано до тих самих функцій належності з вагами з методу множення матриць, помноженими на вагу групи і компоненту T. Враховано лише альтернативи, що пройшли критерій безпеки."
        actions={
          table && (
            <Button variant="outline" size="sm" onClick={() => void copyTableForWord(table)}>
              <ClipboardCopy />
              Копіювати таблицю
            </Button>
          )
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {comparison.methods.map((method, index) => (
          <MethodColumn
            key={method.method}
            title={METHOD_META[index]?.title ?? method.method}
            subtitle={METHOD_META[index]?.subtitle ?? ''}
            method={method}
            ids={comparison.alternativeIds}
            nameById={nameById}
            colorById={meta.colorById}
            primary={index === 0}
          />
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {topsisMethod && <CorrelationCard title="Запропонований ↔ TOPSIS" value={topsisMethod.correlation} />}
        {vikorMethod && <CorrelationCard title="Запропонований ↔ VIKOR" value={vikorMethod.correlation} />}
        <CorrelationCard title="TOPSIS ↔ VIKOR" value={topsisVikor} />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Зміна рангів між методами</CardTitle>
            <CardDescription>Чим рівніші лінії, тим більше методи погоджуються.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <BumpChart
            ariaLabel="Ранги альтернатив за трьома методами"
            columns={comparison.methods.map((method, index) => ({
              key: method.method,
              label: METHOD_META[index]?.title ?? method.method,
              sublabel: ['Z*', 'C', 'Q'][index],
            }))}
            series={comparison.alternativeIds.map((id, index) => ({
              id,
              label: nameById.get(id) ?? id,
              color: meta.colorById.get(id) ?? 'var(--primary)',
              ranks: comparison.methods.map((method) => method.ranks[index] ?? null),
            }))}
            highlightColumn={0}
          />
        </CardContent>
      </Card>

      <Callout title="Чому методи можуть розходитися">
        {sameWinner ? 'Усі три методи обрали одного переможця. ' : 'Переможці відрізняються, і це очікувано. '}
        Запропонований метод винагороджує близькість до вектора задоволення T: альтернатива, яка «перевиконує» ціль із
        низьким пріоритетом, не отримує за це переваги, а відхилення понад m не штрафується. TOPSIS і VIKOR максимізують
        показники: що вищі оцінки за всіма критеріями, то краще. Тому найсильніша за абсолютними значеннями альтернатива може
        поступитися тій, що краще відповідає потребам ОПР
        {proposed ? `, як-от «${nameById.get(comparison.alternativeIds[proposed.ranks.indexOf(1)] ?? '')}» тут` : ''}.
      </Callout>
    </div>
  )
}
