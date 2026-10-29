import { useMemo } from 'react'
import { FORMULAS } from '@/app/formulas'
import { normalizedZ } from '@/app/resultTables'
import type { ResultMeta } from '@/app/useResultMeta'
import { AltDot } from '@/components/app/AltDot'
import { MatrixTable } from '@/components/app/MatrixTable'
import { Formula, Tex } from '@/components/app/Tex'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { AnalysisResult } from '@/core/analysis'
import type { Matrix } from '@/core/matrix'
import { matrixMultiplicationSteps } from '@/core/matrixMethod'
import type { Project } from '@/core/model'
import { formatFixed, formatNumber } from '@/lib/utils'
import { useUiStore } from '@/store/uiStore'

type CalculationDetailsProps = {
  project: Project
  analysis: AnalysisResult
  meta: ResultMeta
}

type GroupOption = {
  key: string
  goalIndex: number
  groupIndex: number | null
  label: string
}

type StepsViewProps = {
  decision: Matrix
  order: Project['powerMeanOrder']
  rowLabels: string[]
  rowTitles: string[]
  columnLabels: string[]
  rowKind: string
}

function texVector(values: number[], digits = 3): string {
  return `\\left(${values.map((value) => formatFixed(value, digits).replace(',', '{,}')).join(';\\;')}\\right)`
}

function groupOptions(project: Project, analysis: AnalysisResult): GroupOption[] {
  const options: GroupOption[] = []
  project.goals.forEach((goal, goalIndex) => {
    const aggregation = analysis.goals[goalIndex]
    if (!aggregation) return
    const groups = goal.groups.filter((group) => group.criteria.length > 0)
    groups.forEach((group, groupIndex) => {
      options.push({ key: `${goalIndex}:${groupIndex}`, goalIndex, groupIndex, label: group.name })
    })
    if (groups.length > 1) {
      options.push({ key: `${goalIndex}:goal`, goalIndex, groupIndex: null, label: 'Агрегування груп у ціль' })
    }
  })
  return options
}

function StepsView(props: StepsViewProps) {
  const { decision, order, rowLabels, rowTitles, columnLabels, rowKind } = props
  const steps = useMemo(() => matrixMultiplicationSteps(decision, order), [decision, order])
  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-5 xl:grid-cols-2">
        <MatrixTable
          label="A"
          caption={`функції належності, ${rowKind} × альтернативи`}
          matrix={steps.decision}
          rowLabels={rowLabels}
          rowTitles={rowTitles}
          columnLabels={columnLabels}
          highlightRowMax
        />
        <MatrixTable
          label="NA"
          caption="(1/n)·A·Aᵀ, зв’язки між рядками"
          matrix={steps.normalizedRelation}
          rowLabels={rowLabels}
          rowTitles={rowTitles}
          columnLabels={rowLabels}
        />
      </div>
      <MatrixTable
        label="p, W"
        caption={`середнє порядку t = ${order} та нормовані ваги`}
        matrix={[steps.importance, steps.criteriaWeights]}
        rowLabels={['p', 'W']}
        columnLabels={rowLabels}
        columnTitles={rowTitles}
      />
      <div className="grid gap-5 xl:grid-cols-2">
        <MatrixTable
          label="B"
          caption="W ∘ A, зважені функції належності"
          matrix={steps.weighted}
          rowLabels={rowLabels}
          rowTitles={rowTitles}
          columnLabels={columnLabels}
        />
        <MatrixTable
          label="C"
          caption="Aᵀ·B, альтернативи × альтернативи"
          matrix={steps.alternativesRelation}
          rowLabels={columnLabels}
          columnLabels={columnLabels}
        />
      </div>
      <MatrixTable
        label="r"
        caption="нормовані суми стовпців C, вектор оцінок"
        matrix={[steps.scores]}
        rowLabels={['r']}
        columnLabels={columnLabels}
        highlightRowMax
      />
    </div>
  )
}

export function CalculationDetails(props: CalculationDetailsProps) {
  const { project, analysis, meta } = props
  const options = useMemo(() => groupOptions(project, analysis), [project, analysis])
  const stored = useUiStore((state) => state.detailGroup)
  const setDetailGroup = useUiStore((state) => state.setDetailGroup)
  const selected = options.find((option) => option.key === stored) ?? options[0] ?? null
  const columnLabels = project.alternatives.map((alt) => alt.name)
  const excluded = analysis.alternatives.filter((alt) => !alt.passesSecurity)

  let stepsView = null
  if (selected) {
    const goal = project.goals[selected.goalIndex]
    const groups = goal.groups.filter((group) => group.criteria.length > 0)
    const aggregation = analysis.goals[selected.goalIndex]
    if (selected.groupIndex !== null) {
      const group = groups[selected.groupIndex]
      stepsView = (
        <StepsView
          key={selected.key}
          decision={analysis.memberships[selected.goalIndex][selected.groupIndex]}
          order={project.powerMeanOrder}
          rowLabels={group.criteria.map((_, index) => `k${index + 1}`)}
          rowTitles={group.criteria.map((criterion) => criterion.name)}
          columnLabels={columnLabels}
          rowKind="критерії"
        />
      )
    } else if (aggregation) {
      stepsView = (
        <StepsView
          key={selected.key}
          decision={aggregation.groups.map((group) => group.scores)}
          order={project.powerMeanOrder}
          rowLabels={groups.map((_, index) => `S${index + 1}`)}
          rowTitles={groups.map((group) => group.name)}
          columnLabels={columnLabels}
          rowKind="групи"
        />
      )
    }
  }

  return (
    <Accordion type="multiple" defaultValue={['satisfaction']}>
      <AccordionItem value="satisfaction">
        <AccordionTrigger>
          <span>Вектор задоволення: відхилення n, відстань μ, оцінки Z</span>
          <span className="text-xs font-normal text-muted-foreground">формули ({FORMULAS.spread.number})–({FORMULAS.best.number})</span>
        </AccordionTrigger>
        <AccordionContent className="flex flex-col gap-5">
          <div className="grid gap-x-8 gap-y-1 rounded-lg border bg-muted/30 px-5 py-3 lg:grid-cols-2">
            <Formula math={`${FORMULAS.spread.tex} = ${texVector(analysis.spread)}`} number={FORMULAS.spread.number} />
            <Formula math={FORMULAS.distance.tex} number={FORMULAS.distance.number} />
            <Formula math={FORMULAS.closeness.tex} number={FORMULAS.closeness.number} />
            <Formula math={FORMULAS.z.tex} number={FORMULAS.z.number} />
            <Formula math={`${FORMULAS.zStar.tex}, \\quad T = ${texVector(analysis.target, 1)}`} number={FORMULAS.zStar.number} />
            <Formula math={FORMULAS.best.tex} number={FORMULAS.best.number} />
          </div>
          <Table containerClassName="rounded-lg border">
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Альтернатива</TableHead>
                {meta.goalLabels.map((label, index) => (
                  <TableHead key={`n-${label}`} className="text-right normal-case">
                    n<sub>{index + 1}</sub>
                  </TableHead>
                ))}
                {meta.goalLabels.map((label, index) => (
                  <TableHead key={`mu-${label}`} className="text-right normal-case">
                    μ<sub>{index + 1}</sub>
                  </TableHead>
                ))}
                {meta.goalLabels.map((label, index) => (
                  <TableHead key={`z-${label}`} className="text-right normal-case">
                    z<sub>{index + 1}</sub>
                  </TableHead>
                ))}
                <TableHead className="text-right normal-case">Z*</TableHead>
                <TableHead className="pr-4 text-right normal-case">Z*/Σt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analysis.ranking.map((alt) => {
                const satisfaction = alt.satisfaction
                if (!satisfaction) return null
                return (
                  <TableRow key={alt.id}>
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-2">
                        <AltDot color={meta.colorById.get(alt.id) ?? 'var(--primary)'} />
                        <span className="font-medium">{alt.name}</span>
                      </div>
                    </TableCell>
                    {satisfaction.distance.map((value, index) => (
                      <TableCell key={`n${index}`} className="text-right num">
                        {formatFixed(value)}
                      </TableCell>
                    ))}
                    {satisfaction.closeness.map((value, index) => (
                      <TableCell
                        key={`mu${index}`}
                        className="text-right num"
                        title={value < satisfaction.distance[index] - 1e-9 ? 'Обмежено значенням m' : undefined}
                      >
                        {formatFixed(value)}
                        {value < satisfaction.distance[index] - 1e-9 && <span className="ml-0.5 text-primary">*</span>}
                      </TableCell>
                    ))}
                    {satisfaction.z.map((value, index) => (
                      <TableCell key={`z${index}`} className="text-right num">
                        {formatFixed(value)}
                      </TableCell>
                    ))}
                    <TableCell className="text-right font-semibold num">{formatFixed(satisfaction.zStar)}</TableCell>
                    <TableCell className="pr-4 text-right text-muted-foreground num">
                      {formatFixed(normalizedZ(satisfaction.zStar, analysis))}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          <p className="text-xs text-muted-foreground">
            <span className="text-primary">*</span> відхилення перевищило m, тому μ обрізано до m: далі від T альтернатива вже
            не втрачає оцінку за цією ціллю.
          </p>
        </AccordionContent>
      </AccordionItem>

      {project.inputMode === 'criteria' && selected && (
        <AccordionItem value="matrix">
          <AccordionTrigger>
            <span>Метод множення матриць: A, NA, W, B, C</span>
            <span className="text-xs font-normal text-muted-foreground">
              формули ({FORMULAS.decision.number})–({FORMULAS.scores.number})
            </span>
          </AccordionTrigger>
          <AccordionContent className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[13px] text-muted-foreground">Група критеріїв</span>
              <Select value={selected.key} onValueChange={setDetailGroup}>
                <SelectTrigger className="h-8 w-80 max-w-full" aria-label="Група критеріїв для деталізації">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {project.goals.map((goal, goalIndex) => {
                    const goalOptions = options.filter((option) => option.goalIndex === goalIndex)
                    if (goalOptions.length === 0) return null
                    return (
                      <SelectGroup key={goal.id}>
                        <SelectLabel>{meta.goalLabels[goalIndex]}</SelectLabel>
                        {goalOptions.map((option) => (
                          <SelectItem key={option.key} value={option.key}>
                            G{goalIndex + 1} · {option.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )
                  })}
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">
                t = {project.powerMeanOrder}, n = {project.alternatives.length}
              </span>
            </div>
            <div className="grid gap-x-8 gap-y-1 rounded-lg border bg-muted/30 px-5 py-3 lg:grid-cols-2">
              <Formula math={FORMULAS.relation.tex} number={FORMULAS.relation.number} />
              <Formula math={FORMULAS.powerMean.tex} number={FORMULAS.powerMean.number} />
              <Formula math={FORMULAS.weights.tex} number={FORMULAS.weights.number} />
              <Formula math={FORMULAS.weighted.tex} number={FORMULAS.weighted.number} />
              <Formula math={FORMULAS.alternativesRelation.tex} number={FORMULAS.alternativesRelation.number} />
              <Formula math={FORMULAS.scores.tex} number={FORMULAS.scores.number} />
            </div>
            {stepsView}
          </AccordionContent>
        </AccordionItem>
      )}

      {project.inputMode === 'criteria' && (
        <AccordionItem value="weights">
          <AccordionTrigger>Ваги груп і критеріїв, оцінки за цілями</AccordionTrigger>
          <AccordionContent className="flex flex-col gap-5">
            {project.goals.map((goal, goalIndex) => {
              const aggregation = analysis.goals[goalIndex]
              if (!aggregation) return null
              const groups = goal.groups.filter((group) => group.criteria.length > 0)
              return (
                <Table key={goal.id} containerClassName="rounded-lg border">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-4 normal-case tracking-normal text-foreground">{meta.goalLabels[goalIndex]}</TableHead>
                      <TableHead className="text-right">Вага</TableHead>
                      {project.alternatives.map((alt) => (
                        <TableHead key={alt.id} className="text-right normal-case tracking-normal">
                          {alt.name}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groups.map((group, groupIndex) => {
                      const groupResult = aggregation.groups[groupIndex]
                      const membership = analysis.memberships[goalIndex][groupIndex]
                      return [
                        <TableRow key={group.id} className="bg-muted/40 font-medium">
                          <TableCell className="pl-4">
                            S{groupIndex + 1} · {group.name}
                          </TableCell>
                          <TableCell className="text-right num">{formatFixed(aggregation.groupWeights[groupIndex] ?? 0)}</TableCell>
                          {groupResult.scores.map((score, index) => (
                            <TableCell key={project.alternatives[index].id} className="text-right num">
                              {formatFixed(score)}
                            </TableCell>
                          ))}
                        </TableRow>,
                        ...group.criteria.map((criterion, criterionIndex) => (
                          <TableRow key={criterion.id} className="text-muted-foreground">
                            <TableCell className="pl-8">
                              k{criterionIndex + 1} · {criterion.name}
                            </TableCell>
                            <TableCell className="text-right num">
                              {formatFixed(groupResult.criteriaWeights[criterionIndex] ?? 0)}
                            </TableCell>
                            {membership[criterionIndex].map((value, index) => (
                              <TableCell key={project.alternatives[index].id} className="text-right num">
                                {formatFixed(value)}
                              </TableCell>
                            ))}
                          </TableRow>
                        )),
                      ]
                    })}
                    <TableRow className="font-semibold">
                      <TableCell className="pl-4">Оцінка за ціллю g</TableCell>
                      <TableCell />
                      {aggregation.scores.map((score, index) => (
                        <TableCell key={project.alternatives[index].id} className="text-right num">
                          {formatFixed(score)}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              )
            })}
            <p className="text-xs text-muted-foreground">
              Для критеріїв показано функції належності: максимізація <Tex math="x / \max x" />, мінімізація{' '}
              <Tex math="\min x / x" />. Ваги обчислено автоматично, без попарних порівнянь.
            </p>
          </AccordionContent>
        </AccordionItem>
      )}

      {excluded.length > 0 && (
        <AccordionItem value="excluded">
          <AccordionTrigger>
            <span>Відсіяні критерієм безпеки</span>
            <span className="text-xs font-normal text-muted-foreground num">{excluded.length}</span>
          </AccordionTrigger>
          <AccordionContent>
            <ul className="flex flex-col gap-1.5 text-[13px]">
              {excluded.map((alt) => (
                <li key={alt.id} className="flex items-center gap-2">
                  <AltDot color={meta.colorById.get(alt.id) ?? 'var(--primary)'} muted />
                  <span className="font-medium">{alt.name}</span>
                  <span className="text-muted-foreground">
                    найслабша координата {formatNumber(Math.min(...alt.goalScores), 3)} → B{alt.securityLevel}, нижче порогу B
                    {project.minSecurityLevel}
                  </span>
                </li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      )}
    </Accordion>
  )
}
