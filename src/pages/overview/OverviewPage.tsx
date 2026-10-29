import { ArrowRight, CircleAlert, CircleCheck, CircleDashed, TriangleAlert } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { type RouteId, routeHref } from '@/app/routes'
import { TEMPLATES } from '@/app/templates'
import { useAnalysis, useIssues } from '@/app/useAnalysis'
import { useResultMeta } from '@/app/useResultMeta'
import { type Issue, criteriaCount } from '@/app/validation'
import { AltDot } from '@/components/app/AltDot'
import { SecurityBadge } from '@/components/app/SecurityBadge'
import { Stat } from '@/components/app/Stat'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { AnalysisResult } from '@/core/analysis'
import type { Project } from '@/core/model'
import { correlationColor } from '@/lib/colors'
import { cn, formatFixed, formatVector, pluralUk } from '@/lib/utils'
import { useProjectStore } from '@/store/projectStore'
import { useUiStore } from '@/store/uiStore'

type StageStatus = 'ok' | 'warning' | 'error' | 'skipped'

type Stage = {
  title: string
  summary: string
  route: RouteId
  status: StageStatus
}

type StageCardProps = {
  stage: Stage
  index: number
  last: boolean
}

const TEMPLATE_TITLES = new Map(TEMPLATES.map((template) => [template.id, template.create().title]))

const STATUS_META: Record<StageStatus, { icon: LucideIcon; label: string; className: string }> = {
  ok: { icon: CircleCheck, label: 'Заповнено', className: 'text-success' },
  warning: { icon: TriangleAlert, label: 'Є попередження', className: 'text-warning' },
  error: { icon: CircleAlert, label: 'Є помилки', className: 'text-destructive' },
  skipped: { icon: CircleDashed, label: 'Пропущено', className: 'text-muted-foreground' },
}

function statusFrom(issues: Issue[]): StageStatus {
  if (issues.some((issue) => issue.level === 'error')) return 'error'
  if (issues.length > 0) return 'warning'
  return 'ok'
}

function buildStages(project: Project, analysis: AnalysisResult, issues: Issue[]): Stage[] {
  const criteriaMode = project.inputMode === 'criteria'
  const groups = project.goals.reduce((sum, goal) => sum + goal.groups.filter((group) => group.criteria.length > 0).length, 0)
  const criteria = criteriaCount(project)
  const valueIssues = issues.filter((issue) => issue.route === 'goals')
  const benefit = project.goals.flatMap((goal) => goal.groups.flatMap((group) => group.criteria)).filter((item) => item.direction === 'benefit').length
  return [
    {
      title: 'Дані',
      summary: `${project.alternatives.length} альт. · ${criteriaMode ? `${criteria} крит.` : 'готові оцінки'}`,
      route: 'alternatives',
      status: statusFrom(issues.filter((issue) => issue.route === 'alternatives')),
    },
    {
      title: 'Функції належності',
      summary: criteriaMode ? `${benefit} max · ${criteria - benefit} min` : 'не потрібні',
      route: 'goals',
      status: criteriaMode ? statusFrom(valueIssues) : 'skipped',
    },
    {
      title: 'Агрегування за групами',
      summary: criteriaMode ? `${groups} ${pluralUk(groups, 'група', 'групи', 'груп')} · t = ${project.powerMeanOrder}` : 'не потрібне',
      route: 'results',
      status: criteriaMode ? statusFrom(valueIssues.filter((issue) => issue.groupId)) : 'skipped',
    },
    {
      title: 'Агрегування за цілями',
      summary: `${project.goals.length} ${pluralUk(project.goals.length, 'ціль', 'цілі', 'цілей')}`,
      route: 'goals',
      status: statusFrom(valueIssues.filter((issue) => !issue.groupId)),
    },
    {
      title: 'Критерій безпеки',
      summary: `B${project.minSecurityLevel} · ${analysis.ranking.length}/${analysis.alternatives.length} допущено`,
      route: 'params',
      status: statusFrom(issues.filter((issue) => issue.route === 'params')),
    },
    {
      title: 'Вектор задоволення',
      summary: `T = ${formatVector(analysis.target, 1)}`,
      route: 'params',
      status: 'ok',
    },
    {
      title: 'Ранжування',
      summary: analysis.best ? `X* = ${analysis.best.name}` : 'немає допустимих',
      route: 'results',
      status: analysis.best ? 'ok' : 'error',
    },
  ]
}

function StageCard(props: StageCardProps) {
  const { stage, index, last } = props
  const meta = STATUS_META[stage.status]
  const Icon = meta.icon
  return (
    <li className="relative flex min-w-0">
      <a
        href={routeHref(stage.route)}
        className="group flex w-full min-w-0 flex-col gap-2 rounded-lg border bg-card p-3 outline-none transition-colors hover:border-primary/40 hover:bg-primary/[0.03] focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="flex size-6 items-center justify-center rounded-md bg-muted text-xs font-semibold num group-hover:bg-primary group-hover:text-primary-foreground">
            {index + 1}
          </span>
          <Icon className={cn('size-4', meta.className)} aria-label={meta.label} />
        </div>
        <div className="text-[13px] leading-5 font-medium">{stage.title}</div>
        <div className="truncate text-xs text-muted-foreground num" title={stage.summary}>
          {stage.summary}
        </div>
      </a>
      {!last && (
        <ArrowRight
          className="absolute top-1/2 -right-[15px] z-10 hidden size-3.5 -translate-y-1/2 text-muted-foreground/70 xl:block"
          aria-hidden
        />
      )}
    </li>
  )
}

export function OverviewPage() {
  const project = useProjectStore((state) => state.project)
  const analysis = useAnalysis()
  const issues = useIssues()
  const meta = useResultMeta(project, analysis)
  const requestTemplate = useUiStore((state) => state.requestTemplate)
  const stages = buildStages(project, analysis, issues)
  const best = analysis.best
  const topsis = analysis.comparison?.methods[1]

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <div className="eyebrow">Інформаційна технологія підтримки прийняття рішень</div>
        <h1 className="max-w-4xl text-[28px] leading-9 font-semibold tracking-[-0.025em]">
          Багатокритеріальний вибір альтернатив за групами цілей
        </h1>
        <p className="max-w-3xl text-[15px] leading-6 text-muted-foreground">
          Особа, що приймає рішення, обирає альтернативу, яка одночасно задовольняє кілька цілей, кожна з яких оцінюється
          групами кількісних критеріїв. Оцінки агрегуються методом множення матриць без попарних порівнянь, ненадійні
          варіанти відсіює критерій безпеки за найслабшою ціллю, а ранжування виконується за близькістю до «вектора
          задоволення» потреб ОПР.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <a href={routeHref('results')}>
              Переглянути результати
              <ArrowRight />
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href={routeHref('method')}>Про метод</a>
          </Button>
        </div>
      </section>

      <Card className="grid grid-cols-1 divide-y sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
        <Stat
          label="Найкраща альтернатива"
          value={
            best ? (
              <span className="flex items-center gap-2">
                <AltDot color={meta.colorById.get(best.id) ?? 'var(--primary)'} className="size-3" />
                {best.name}
              </span>
            ) : (
              'немає'
            )
          }
          hint={best ? <SecurityBadge level={best.securityLevel} showLabel /> : 'знизьте поріг безпеки'}
        />
        <Stat
          label="Інтегральна оцінка Z*"
          value={best ? formatFixed(best.satisfaction?.zStar ?? 0) : '—'}
          hint={`з максимально можливих ${formatFixed(analysis.target.reduce((a, b) => a + b, 0), 1)}`}
          className="sm:border-l lg:border-l-0"
        />
        <Stat
          label="Пройшли критерій безпеки"
          value={`${analysis.ranking.length} з ${analysis.alternatives.length}`}
          hint={`поріг B${project.minSecurityLevel}`}
        />
        <Stat
          label="Кореляція з TOPSIS"
          value={
            topsis ? <span style={{ color: correlationColor(topsis.correlation) }}>{formatFixed(topsis.correlation)}</span> : '—'
          }
          hint={topsis ? 'ρ Спірмена між ранжуваннями' : 'лише для матриць критеріїв'}
          className="sm:border-l lg:border-l-0"
        />
      </Card>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-[15px] font-semibold">Етапи інформаційної технології</h2>
          <span className="text-xs text-muted-foreground">Кожен етап відкриває відповідний екран</span>
        </div>
        <ol className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-7 xl:gap-[22px]">
          {stages.map((stage, index) => (
            <StageCard key={stage.title} stage={stage} index={index} last={index === stages.length - 1} />
          ))}
        </ol>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-[15px] font-semibold">Шаблони проєкту</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {TEMPLATES.map((template) => {
            const current = TEMPLATE_TITLES.get(template.id) === project.title
            return (
              <Card key={template.id} className={cn('justify-between gap-4 p-5', current && 'border-primary/40')}>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold">{template.title}</span>
                    {current && <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary">поточний</span>}
                  </div>
                  <p className="text-xs leading-5 text-muted-foreground">{template.description}</p>
                </div>
                <Button variant="outline" size="sm" className="w-fit" onClick={() => requestTemplate(template.id)}>
                  {current ? 'Почати заново' : 'Відкрити'}
                </Button>
              </Card>
            )
          })}
        </div>
      </section>
    </div>
  )
}
