import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useProjectStore } from '@/store/projectStore'
import { NumberInput } from './NumberInput'

export function DirectScoresCard() {
  const project = useProjectStore((state) => state.project)
  const setDirectScore = useProjectStore((state) => state.setDirectScore)
  const renameGoal = useProjectStore((state) => state.renameGoal)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Готові оцінки альтернатив за цілями</CardTitle>
        <CardDescription>
          Значення з інтервалу [0; 1], отримані раніше будь-яким методом. Агрегування за критеріями пропускається.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-56">Ціль</TableHead>
              {project.alternatives.map((alternative) => (
                <TableHead key={alternative.id} className="text-right">
                  {alternative.name}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {project.goals.map((goal) => (
              <TableRow key={goal.id}>
                <TableCell>
                  <Input value={goal.name} onChange={(event) => renameGoal(goal.id, event.target.value)} className="h-8" />
                </TableCell>
                {project.alternatives.map((alternative) => (
                  <TableCell key={alternative.id} className="text-right">
                    <NumberInput
                      ariaLabel={`${goal.name}: ${alternative.name}`}
                      value={goal.directScores[alternative.id] ?? 0}
                      min={0}
                      max={1}
                      onCommit={(value) => setDirectScore(goal.id, alternative.id, value)}
                      className="ml-auto"
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
