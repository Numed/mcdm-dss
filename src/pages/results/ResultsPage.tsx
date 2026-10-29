import { ClipboardCopy, Download, ShieldOff } from 'lucide-react'
import { copyTableForWord, exportResultsXlsx } from '@/app/exportResults'
import { rankingTable } from '@/app/resultTables'
import { routeHref } from '@/app/routes'
import { useAnalysis } from '@/app/useAnalysis'
import { useResultMeta } from '@/app/useResultMeta'
import { Callout } from '@/components/app/Callout'
import { EmptyState } from '@/components/app/EmptyState'
import { PageHeader } from '@/components/app/PageHeader'
import { Tex } from '@/components/app/Tex'
import { GoalSpaceChart } from '@/components/charts/GoalSpaceChart'
import { RadarChart } from '@/components/charts/RadarChart'
import { ZStarBreakdown } from '@/components/charts/ZStarBreakdown'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatNumber } from '@/lib/utils'
import { useProjectStore } from '@/store/projectStore'
import { CalculationDetails } from './CalculationDetails'
import { RankingTable } from './RankingTable'
import { ResultsHero } from './ResultsHero'

export function ResultsPage() {
  const project = useProjectStore((state) => state.project)
  const analysis = useAnalysis()
  const meta = useResultMeta(project, analysis)
  const goalCount = project.goals.length
  const targetSum = analysis.target.reduce((acc, value) => acc + value, 0)
  const setSatisfactionTerms = useProjectStore((state) => state.setSatisfactionTerms)
  const moveTarget = (termX: number, termY: number) => {
    const [goalX, goalY] = project.goals
    if (goalX && goalY) setSatisfactionTerms([{ goalId: goalX.id, term: termX }, { goalId: goalY.id, term: termY }])
  }

  const actions = (
    <>
      <Button variant="outline" size="sm" onClick={() => void copyTableForWord(rankingTable(project, analysis))}>
        <ClipboardCopy />
        Копіювати таблицю
      </Button>
      <Button variant="outline" size="sm" onClick={() => void exportResultsXlsx()}>
        <Download />
        Excel
      </Button>
    </>
  )

  if (!analysis.best) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Результати" />
        <Card>
          <EmptyState
            icon={ShieldOff}
            title="Немає допустимих альтернатив"
            description={`Жодна альтернатива не пройшла критерій безпеки B${project.minSecurityLevel}. Знизьте поріг або змініть вхідні дані.`}
            action={
              <Button asChild size="sm">
                <a href={routeHref('params')}>Відкрити параметри</a>
              </Button>
            }
          />
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Результати"
        description="Альтернативи ранжовано за близькістю до вектора задоволення T серед тих, що пройшли критерій безпеки."
        actions={actions}
      />

      <ResultsHero project={project} analysis={analysis} meta={meta} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>{goalCount === 2 ? 'Простір цілей' : 'Оцінки за цілями'}</CardTitle>
              <CardDescription>
                {goalCount === 2
                  ? 'Кожна альтернатива як точка (g₁; g₂). Зони B1–B5 відповідають рівню безпеки за найслабшою ціллю.'
                  : 'Пелюсткова діаграма для більше ніж двох цілей. Пунктир показує вектор задоволення T.'}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {goalCount === 2 && (
              <GoalSpaceChart
                alternatives={analysis.alternatives}
                colorById={meta.colorById}
                rankById={meta.rankById}
                target={analysis.target}
                goalNames={meta.goalLabels}
                minSecurityLevel={project.minSecurityLevel}
                onTargetChange={moveTarget}
              />
            )}
            {goalCount > 2 && (
              <RadarChart
                alternatives={analysis.alternatives}
                colorById={meta.colorById}
                rankById={meta.rankById}
                target={analysis.target}
                goalNames={meta.goalNames}
              />
            )}
            {goalCount < 2 && (
              <p className="py-8 text-center text-[13px] text-muted-foreground">Для графіка потрібно щонайменше дві цілі.</p>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Склад інтегральної оцінки</CardTitle>
                <CardDescription>
                  <Tex math="Z^* = \sum z_l t_l" />: внесок кожної цілі зважено її компонентою вектора задоволення.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <ZStarBreakdown
                ranking={analysis.ranking}
                colorById={meta.colorById}
                rankById={meta.rankById}
                target={analysis.target}
                goalNames={meta.goalNames}
              />
            </CardContent>
          </Card>
          <Callout title="Чому Z* може бути більше 1">
            Компоненти T одночасно задають вагу цілей і не нормуються: Σt = {formatNumber(targetSum, 2)}, тому максимум Z*
            дорівнює {formatNumber(targetSum, 2)}, а не 1. Для порівняння між проєктами використовуйте нормовану оцінку Z*/Σt
            з діапазону [0; 1]. На ранжування нормування не впливає.
          </Callout>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Ранжувальний ряд</CardTitle>
            <CardDescription>
              Однакові Z* мають однаковий ранг (позначка «=»). Відсіяні альтернативи наприкінці.
            </CardDescription>
          </div>
          <CardAction>
            <Button variant="ghost" size="xs" onClick={() => void copyTableForWord(rankingTable(project, analysis))}>
              <ClipboardCopy />
              Для Word
            </Button>
          </CardAction>
        </CardHeader>
        <RankingTable analysis={analysis} meta={meta} />
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <div>
            <CardTitle>Деталі розрахунку</CardTitle>
            <CardDescription>Проміжні величини методу з формулами для розділу 3 і перевірки вручну.</CardDescription>
          </div>
        </CardHeader>
        <CalculationDetails project={project} analysis={analysis} meta={meta} />
      </Card>
    </div>
  )
}
