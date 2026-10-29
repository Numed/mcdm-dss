import { Trophy } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { AlternativeResult, AnalysisResult } from '@/core/analysis'
import type { Project } from '@/core/model'
import { SECURITY_LEVELS } from '@/core/security'
import { cn, formatNumber } from '@/lib/utils'
import { GoalSpaceChart } from './GoalSpaceChart'
import { WeightsCard } from './WeightsCard'

type ResultsTabProps = {
  project: Project
  analysis: AnalysisResult
}

type VectorTextProps = {
  values: number[]
}

type ZStarBarsProps = {
  ranking: AlternativeResult[]
}

function VectorText(props: VectorTextProps) {
  return <span className="tabular-nums">({props.values.map((value) => formatNumber(value, 3)).join('; ')})</span>
}

type SecurityBadgeVariant = 'destructive' | 'success' | 'warning' | 'secondary'

function securityVariant(level: number, passes: boolean): SecurityBadgeVariant {
  if (!passes) return 'destructive'
  if (level >= 4) return 'success'
  if (level === 3) return 'warning'
  return 'secondary'
}

function ZStarBars(props: ZStarBarsProps) {
  const { ranking } = props
  const max = Math.max(...ranking.map((alt) => alt.satisfaction?.zStar ?? 0), 1e-9)
  return (
    <div className="flex flex-col gap-2">
      {ranking.map((alt) => {
        const value = alt.satisfaction?.zStar ?? 0
        return (
          <div key={alt.id} className="grid grid-cols-[6rem_1fr_3.5rem] items-center gap-3 text-sm">
            <span className="truncate">{alt.name}</span>
            <div className="h-5 rounded bg-muted">
              <div
                className={cn('h-5 rounded', alt.rank === 1 ? 'bg-primary' : 'bg-primary/45')}
                style={{ width: `${(value / max) * 100}%` }}
              />
            </div>
            <span className="text-right tabular-nums">{formatNumber(value, 3)}</span>
          </div>
        )
      })}
    </div>
  )
}

export function ResultsTab(props: ResultsTabProps) {
  const { project, analysis } = props
  const goalNames = project.goals.map((goal, index) => `G${index + 1}: ${goal.name.replace(/^G\d+:\s*/, '')}`)
  const excluded = analysis.alternatives.filter((alt) => !alt.passesSecurity)
  const best = analysis.best

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-1 border-primary/40 bg-primary/[0.03]">
          <CardHeader>
            <CardDescription className="flex items-center gap-2">
              <Trophy className="size-4 text-primary" />
              Найкраща альтернатива X*
            </CardDescription>
            <CardTitle className="text-2xl">{best?.name ?? 'Немає допустимих'}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {best && (
              <>
                Z* = <span className="font-medium text-foreground">{formatNumber(best.satisfaction?.zStar ?? 0)}</span>,
                оцінки за цілями <VectorText values={best.goalScores} />
              </>
            )}
            {!best && 'Знизьте поріг безпеки або змініть вхідні дані.'}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Вектор задоволення T</CardDescription>
            <CardTitle className="text-2xl">
              <VectorText values={analysis.target} />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Максимальне відхилення (m) = <VectorText values={analysis.spread} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Пройшли критерій безпеки</CardDescription>
            <CardTitle className="text-2xl">
              {analysis.ranking.length} з {analysis.alternatives.length}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Поріг B{project.minSecurityLevel}
            {excluded.length > 0 && `, відсіяно: ${excluded.map((alt) => alt.name).join(', ')}`}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {project.goals.length === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Простір цілей</CardTitle>
              <CardDescription>
                Смуги відповідають рівням безпеки B1-B5, ромб - вектор задоволення T, порожні точки відсіяні
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <GoalSpaceChart
                alternatives={analysis.alternatives}
                target={analysis.target}
                goalNames={goalNames}
                minSecurityLevel={project.minSecurityLevel}
              />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Інтегральна оцінка Z*</CardTitle>
            <CardDescription>Чим ближча альтернатива до вектора задоволення з урахуванням ваги цілей, тим більше Z*</CardDescription>
          </CardHeader>
          <CardContent>
            <ZStarBars ranking={analysis.ranking} />
          </CardContent>
        </Card>
      </div>

      <Card>
          <CardHeader>
            <CardTitle>Ранжувальний ряд</CardTitle>
            <CardDescription>
              n - відхилення від T, μ - обрана відстань за формулою (19), Z = 1 - μ, Z* = Σ zᵢ·tᵢ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ранг</TableHead>
                  <TableHead>Альтернатива</TableHead>
                  <TableHead>Оцінки за цілями</TableHead>
                  <TableHead>Безпека</TableHead>
                  <TableHead>n</TableHead>
                  <TableHead>μ</TableHead>
                  <TableHead>Z</TableHead>
                  <TableHead className="text-right">Z*</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...analysis.ranking, ...excluded].map((alt) => (
                  <TableRow key={alt.id} className={cn(!alt.passesSecurity && 'text-muted-foreground')}>
                    <TableCell className="font-semibold tabular-nums">{alt.rank ?? '-'}</TableCell>
                    <TableCell className="font-medium">{alt.name}</TableCell>
                    <TableCell>
                      <VectorText values={alt.goalScores} />
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={securityVariant(alt.securityLevel, alt.passesSecurity)}
                        title={SECURITY_LEVELS[alt.securityLevel - 1].label}
                      >
                        B{alt.securityLevel}
                      </Badge>
                    </TableCell>
                    <TableCell>{alt.satisfaction && <VectorText values={alt.satisfaction.distance} />}</TableCell>
                    <TableCell>{alt.satisfaction && <VectorText values={alt.satisfaction.closeness} />}</TableCell>
                    <TableCell>{alt.satisfaction && <VectorText values={alt.satisfaction.z} />}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {alt.satisfaction ? formatNumber(alt.satisfaction.zStar) : 'відсіяно'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      {project.inputMode === 'criteria' && <WeightsCard project={project} analysis={analysis} />}
    </div>
  )
}
