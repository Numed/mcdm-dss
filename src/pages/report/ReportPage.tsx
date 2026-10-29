import { ArrowLeft, ClipboardCopy, Download, Printer } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { copyTableForWord, exportResultsXlsx } from '@/app/exportResults'
import { type Cell, type DataTable, cellText, comparisonTable, isNumericCell, rankingTable, summaryTable } from '@/app/resultTables'
import { routeHref } from '@/app/routes'
import { useAnalysis } from '@/app/useAnalysis'
import { useResultMeta } from '@/app/useResultMeta'
import { GoalSpaceChart } from '@/components/charts/GoalSpaceChart'
import { RadarChart } from '@/components/charts/RadarChart'
import { ZStarBreakdown } from '@/components/charts/ZStarBreakdown'
import { Button } from '@/components/ui/button'
import type { AnalysisResult } from '@/core/analysis'
import type { Project } from '@/core/model'
import { orderSensitivity } from '@/core/sensitivity'
import { formatFixed, formatNumber, stripGoalPrefix } from '@/lib/utils'
import { useProjectStore } from '@/store/projectStore'

type ReportTableProps = {
  number: number
  table: DataTable
}

type ReportSectionProps = {
  number: number
  title: string
  children: ReactNode
}

type FigureProps = {
  number: number
  caption: string
  children: ReactNode
}

function formatToday(): string {
  return new Date().toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })
}

function ReportSection(props: ReportSectionProps) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-[15px] font-semibold">
        {props.number}. {props.title}
      </h2>
      {props.children}
    </section>
  )
}

function ReportTable(props: ReportTableProps) {
  const { number, table } = props
  return (
    <div className="flex flex-col gap-1.5 break-inside-avoid">
      <div className="flex items-baseline justify-between gap-3">
        <div className="text-[12px] italic">
          Таблиця {number} – {table.title}
        </div>
        <button
          type="button"
          onClick={() => void copyTableForWord(table)}
          className="flex cursor-pointer items-center gap-1 text-[11px] text-neutral-500 hover:text-neutral-900 print:hidden"
        >
          <ClipboardCopy className="size-3" aria-hidden />
          Копіювати для Word
        </button>
      </div>
      <div className="overflow-x-auto print:overflow-visible">
        <table className="w-full border-collapse text-[11px] leading-4">
          <thead>
            <tr>
              {table.headers.map((header) => (
                <th key={header} className="border border-neutral-400 bg-neutral-100 px-1.5 py-1 text-center font-semibold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell: Cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className={`border border-neutral-400 px-1.5 py-1 num ${isNumericCell(cell) ? 'text-right' : 'text-left'}`}
                  >
                    {cellText(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Figure(props: FigureProps) {
  return (
    <figure className="flex flex-col items-center gap-2 break-inside-avoid">
      <div className="w-full">{props.children}</div>
      <figcaption className="text-[12px] italic">
        Рисунок {props.number} – {props.caption}
      </figcaption>
    </figure>
  )
}

function inputTables(project: Project): DataTable[] {
  const names = project.alternatives.map((alt) => alt.name)
  if (project.inputMode === 'direct') {
    return [
      {
        title: 'Оцінки альтернатив за цілями',
        headers: ['Ціль', ...names],
        rows: project.goals.map((goal) => [
          stripGoalPrefix(goal.name),
          ...project.alternatives.map((alt) => formatNumber(goal.directScores[alt.id] ?? 0)),
        ]),
      },
    ]
  }
  return project.goals.map((goal, goalIndex) => ({
    title: `Значення критеріїв за ціллю G${goalIndex + 1} «${stripGoalPrefix(goal.name)}»`,
    headers: ['Група / критерій', 'Напрям', ...names],
    rows: goal.groups.flatMap((group, groupIndex) => [
      [`S${groupIndex + 1}. ${group.name}`, '', ...names.map(() => '')],
      ...group.criteria.map((criterion) => [
        `  ${criterion.name}`,
        criterion.direction === 'benefit' ? 'max' : 'min',
        ...project.alternatives.map((alt) => formatNumber(criterion.values[alt.id] ?? 0)),
      ]),
    ]),
  }))
}

function weightsTable(project: Project, analysis: AnalysisResult): DataTable | null {
  if (project.inputMode !== 'criteria') return null
  const rows: Cell[][] = []
  project.goals.forEach((goal, goalIndex) => {
    const aggregation = analysis.goals[goalIndex]
    if (!aggregation) return
    goal.groups
      .filter((group) => group.criteria.length > 0)
      .forEach((group, groupIndex) => {
        rows.push([`G${goalIndex + 1} / S${groupIndex + 1}. ${group.name}`, aggregation.groupWeights[groupIndex] ?? 0])
        group.criteria.forEach((criterion, criterionIndex) => {
          rows.push([`  ${criterion.name}`, aggregation.groups[groupIndex]?.criteriaWeights[criterionIndex] ?? 0])
        })
      })
  })
  return { title: 'Ваги груп і критеріїв, обчислені методом множення матриць', headers: ['Група / критерій', 'Вага'], rows }
}

function sensitivityTable(project: Project): DataTable | null {
  if (project.inputMode !== 'criteria') return null
  const data = orderSensitivity(project)
  return {
    title: 'Ранги альтернатив за різних порядків середнього t',
    headers: ['Альтернатива', ...data.map((item) => `t = ${item.order}`)],
    rows: project.alternatives.map((alt, index) => [alt.name, ...data.map((item) => String(item.ranks[index] ?? '—'))]),
  }
}

export function ReportPage() {
  const project = useProjectStore((state) => state.project)
  const analysis = useAnalysis()
  const meta = useResultMeta(project, analysis)
  const [date] = useState(formatToday)

  const inputs = inputTables(project)
  const weights = weightsTable(project, analysis)
  const comparison = comparisonTable(project, analysis)
  const sensitivity = sensitivityTable(project)
  const summaryNumber = inputs.length + 1
  const weightsNumber = summaryNumber + 1
  const rankingNumber = weightsNumber + (weights ? 1 : 0)
  const comparisonNumber = rankingNumber + 1
  const sensitivityNumber = comparisonNumber + (comparison ? 1 : 0)

  return (
    <div className="min-h-svh bg-neutral-100 text-neutral-900 print:bg-white">
      <div className="sticky top-0 z-20 flex items-center gap-2 border-b bg-white/90 px-4 py-3 backdrop-blur sm:px-6 print:hidden">
        <Button asChild variant="ghost" size="sm">
          <a href={routeHref('results')}>
            <ArrowLeft />
            До застосунку
          </a>
        </Button>
        <span className="hidden text-[13px] text-neutral-500 sm:inline">Звіт для друку · A4</span>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void exportResultsXlsx()}>
            <Download />
            Excel
          </Button>
          <Button size="sm" onClick={() => window.print()}>
            <Printer />
            Друк / PDF
          </Button>
        </div>
      </div>

      <article className="report mx-auto my-0 flex w-full max-w-[210mm] min-w-0 flex-col gap-8 bg-white px-4 py-6 sm:my-8 sm:px-[16mm] sm:py-[14mm] shadow-sm print:my-0 print:max-w-none print:p-0 print:shadow-none">
        <header className="flex flex-col gap-1 border-b border-neutral-300 pb-4">
          <div className="text-[11px] tracking-[0.06em] text-neutral-500 uppercase">
            СППР «Багатокритеріальний вибір альтернатив за групами цілей»
          </div>
          <h1 className="text-[20px] leading-7 font-semibold">{project.title}</h1>
          <div className="text-[12px] text-neutral-500">Звіт сформовано {date}</div>
        </header>

        <ReportSection number={1} title="Вхідні дані">
          {inputs.map((table, index) => (
            <ReportTable key={table.title} number={index + 1} table={table} />
          ))}
        </ReportSection>

        <ReportSection number={2} title="Параметри та підсумок">
          <ReportTable number={summaryNumber} table={summaryTable(project, analysis)} />
          {weights && <ReportTable number={weightsNumber} table={weights} />}
        </ReportSection>

        <ReportSection number={3} title="Результати ранжування">
          <ReportTable number={rankingNumber} table={rankingTable(project, analysis)} />
          {project.goals.length === 2 && (
            <Figure number={1} caption="Альтернативи в просторі цілей, зони рівнів безпеки та вектор задоволення T">
              <GoalSpaceChart
                alternatives={analysis.alternatives}
                colorById={meta.colorById}
                rankById={meta.rankById}
                target={analysis.target}
                goalNames={meta.goalLabels}
                minSecurityLevel={project.minSecurityLevel}
                maxPlotSize={400}
                interactive={false}
              />
            </Figure>
          )}
          {project.goals.length > 2 && (
            <Figure number={1} caption="Оцінки альтернатив за цілями">
              <RadarChart
                alternatives={analysis.alternatives}
                colorById={meta.colorById}
                rankById={meta.rankById}
                target={analysis.target}
                goalNames={meta.goalNames}
                maxSize={440}
              />
            </Figure>
          )}
          {analysis.ranking.length > 0 && (
            <Figure number={2} caption="Склад інтегральної оцінки Z* за цілями">
              <ZStarBreakdown
                ranking={analysis.ranking}
                colorById={meta.colorById}
                rankById={meta.rankById}
                target={analysis.target}
                goalNames={meta.goalNames}
              />
            </Figure>
          )}
          <p className="text-[12px] leading-5 text-neutral-600">
            Найкраща альтернатива: <b>{analysis.best?.name ?? 'немає'}</b>
            {analysis.best && `, Z* = ${formatFixed(analysis.best.satisfaction?.zStar ?? 0)}`}. Компоненти T не нормуються, тому
            максимум Z* дорівнює Σt = {formatFixed(analysis.target.reduce((a, b) => a + b, 0), 1)}.
          </p>
        </ReportSection>

        {(comparison || sensitivity) && (
          <ReportSection number={4} title="Порівняння і стійкість">
            {comparison && <ReportTable number={comparisonNumber} table={comparison} />}
            {analysis.comparison && (
              <p className="text-[12px] leading-5 text-neutral-600">
                Кореляція Спірмена із запропонованим методом: TOPSIS ρ = {formatFixed(analysis.comparison.methods[1]?.correlation ?? 0)},
                VIKOR ρ = {formatFixed(analysis.comparison.methods[2]?.correlation ?? 0)}.
              </p>
            )}
            {sensitivity && <ReportTable number={sensitivityNumber} table={sensitivity} />}
          </ReportSection>
        )}
      </article>
    </div>
  )
}
