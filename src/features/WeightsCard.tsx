import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { AnalysisResult } from '@/core/analysis'
import type { Project } from '@/core/model'
import { formatNumber } from '@/lib/utils'

type WeightsCardProps = {
  project: Project
  analysis: AnalysisResult
}

export function WeightsCard(props: WeightsCardProps) {
  const { project, analysis } = props

  return (
    <Card>
      <CardHeader>
        <CardTitle>Проміжні результати методу множення матриць</CardTitle>
        <CardDescription>
          Ваги критеріїв обчислені автоматично (кроки 1-4), без попарних порівнянь. Оцінки груп - вектори першого рівня,
          ваги груп - результат другого рівня.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {project.goals.map((goal, goalIndex) => {
          const aggregation = analysis.goals[goalIndex]
          if (!aggregation) return null
          const groups = goal.groups.filter((group) => group.criteria.length > 0)
          return (
            <div key={goal.id} className="flex flex-col gap-2">
              <div className="text-sm font-semibold">
                G{goalIndex + 1}: {goal.name.replace(/^G\d+:\s*/, '')}
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Група / критерій</TableHead>
                    <TableHead className="text-right">Вага</TableHead>
                    {project.alternatives.map((alt) => (
                      <TableHead key={alt.id} className="text-right">
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
                        <TableCell>{group.name}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatNumber(aggregation.groupWeights[groupIndex] ?? 0)}
                        </TableCell>
                        {groupResult.scores.map((score, index) => (
                          <TableCell key={project.alternatives[index].id} className="text-right tabular-nums">
                            {formatNumber(score)}
                          </TableCell>
                        ))}
                      </TableRow>,
                      ...group.criteria.map((criterion, criterionIndex) => (
                        <TableRow key={criterion.id} className="text-muted-foreground">
                          <TableCell className="pl-6">{criterion.name}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatNumber(groupResult.criteriaWeights[criterionIndex] ?? 0)}
                          </TableCell>
                          {membership[criterionIndex].map((value, index) => (
                            <TableCell key={project.alternatives[index].id} className="text-right tabular-nums">
                              {formatNumber(value)}
                            </TableCell>
                          ))}
                        </TableRow>
                      )),
                    ]
                  })}
                  <TableRow className="font-semibold">
                    <TableCell>Оцінка за ціллю</TableCell>
                    <TableCell />
                    {aggregation.scores.map((score, index) => (
                      <TableCell key={project.alternatives[index].id} className="text-right tabular-nums">
                        {formatNumber(score)}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )
        })}
        <p className="text-xs text-muted-foreground">
          Для критеріїв показано значення функцій належності: максимізація x / max, мінімізація min / x.
        </p>
      </CardContent>
    </Card>
  )
}
