import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { AnalysisResult } from '@/core/analysis'
import type { Project } from '@/core/model'
import { formatNumber } from '@/lib/utils'

type CompareTabProps = {
  project: Project
  analysis: AnalysisResult
}

export function CompareTab(props: CompareTabProps) {
  const { project, analysis } = props
  const comparison = analysis.comparison

  if (!comparison) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Порівняння недоступне</CardTitle>
          <CardDescription>
            Порівняння з TOPSIS і VIKOR потребує режиму матриць рішень за критеріями та щонайменше двох альтернатив, що
            пройшли критерій безпеки.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const nameById = new Map(project.alternatives.map((alt) => [alt.id, alt.name]))

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-3">
        {comparison.methods.map((method) => (
          <Card key={method.method}>
            <CardHeader>
              <CardDescription>{method.method}</CardDescription>
              <CardTitle className="text-xl">
                {nameById.get(comparison.alternativeIds[method.ranks.indexOf(1)]) ?? '-'}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Кореляція Спірмена з запропонованим методом:{' '}
              <span className="font-medium text-foreground tabular-nums">{formatNumber(method.correlation, 3)}</span>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Ранги альтернатив за різними методами</CardTitle>
          <CardDescription>
            TOPSIS і VIKOR застосовано до тих самих функцій належності з вагами критеріїв, отриманими методом множення
            матриць, помноженими на вагу групи і вагу цілі з вектора задоволення. Враховуються лише альтернативи, що
            пройшли критерій безпеки.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Альтернатива</TableHead>
                {comparison.methods.map((method) => (
                  <TableHead key={method.method} className="text-right" colSpan={2}>
                    {method.method}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparison.alternativeIds.map((id, index) => (
                <TableRow key={id}>
                  <TableCell className="font-medium">{nameById.get(id)}</TableCell>
                  {comparison.methods.map((method) => [
                    <TableCell key={`${method.method}-score`} className="text-right text-muted-foreground tabular-nums">
                      {formatNumber(method.scores[index])}
                    </TableCell>,
                    <TableCell key={`${method.method}-rank`} className="text-right font-semibold tabular-nums">
                      #{method.ranks[index]}
                    </TableCell>,
                  ])}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
