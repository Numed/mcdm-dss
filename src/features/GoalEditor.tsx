import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Alternative, CriteriaGroup, Goal } from '@/core/model'
import type { CriterionDirection } from '@/core/normalization'
import { useProjectStore } from '@/store/projectStore'
import { NumberInput } from './NumberInput'

type GoalEditorProps = {
  goal: Goal
  index: number
  canRemove: boolean
}

type GroupEditorProps = {
  goalId: string
  group: CriteriaGroup
  alternatives: Alternative[]
  canRemove: boolean
}

function isDirection(value: string): value is CriterionDirection {
  return value === 'benefit' || value === 'cost'
}

function GroupEditor(props: GroupEditorProps) {
  const { goalId, group, alternatives, canRemove } = props
  const renameGroup = useProjectStore((state) => state.renameGroup)
  const removeGroup = useProjectStore((state) => state.removeGroup)
  const addCriterion = useProjectStore((state) => state.addCriterion)
  const updateCriterion = useProjectStore((state) => state.updateCriterion)
  const setCriterionValue = useProjectStore((state) => state.setCriterionValue)
  const removeCriterion = useProjectStore((state) => state.removeCriterion)

  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <div className="mb-2 flex items-center gap-2">
        <Input
          value={group.name}
          onChange={(event) => renameGroup(goalId, group.id, event.target.value)}
          className="h-8 max-w-sm bg-background font-medium"
        />
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Видалити групу"
          disabled={!canRemove}
          onClick={() => removeGroup(goalId, group.id)}
          className="ml-auto"
        >
          <Trash2 />
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-56">Критерій</TableHead>
            <TableHead className="w-36">Напрям</TableHead>
            {alternatives.map((alternative) => (
              <TableHead key={alternative.id} className="text-right">
                {alternative.name}
              </TableHead>
            ))}
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {group.criteria.map((criterion) => (
            <TableRow key={criterion.id}>
              <TableCell>
                <Input
                  value={criterion.name}
                  onChange={(event) => updateCriterion(goalId, group.id, criterion.id, { name: event.target.value })}
                  className="h-8 bg-background"
                />
              </TableCell>
              <TableCell>
                <Select
                  value={criterion.direction}
                  onValueChange={(value) => {
                    if (isDirection(value)) updateCriterion(goalId, group.id, criterion.id, { direction: value })
                  }}
                >
                  <SelectTrigger className="h-8 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="benefit">Максимізація</SelectItem>
                    <SelectItem value="cost">Мінімізація</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              {alternatives.map((alternative) => (
                <TableCell key={alternative.id} className="text-right">
                  <NumberInput
                    ariaLabel={`${criterion.name}: ${alternative.name}`}
                    value={criterion.values[alternative.id] ?? 0}
                    onCommit={(value) => setCriterionValue(goalId, group.id, criterion.id, alternative.id, value)}
                    className="ml-auto bg-background"
                  />
                </TableCell>
              ))}
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Видалити критерій"
                  disabled={group.criteria.length <= 1}
                  onClick={() => removeCriterion(goalId, group.id, criterion.id)}
                >
                  <Trash2 />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Button variant="ghost" size="sm" className="mt-2" onClick={() => addCriterion(goalId, group.id)}>
        <Plus />
        Критерій
      </Button>
    </div>
  )
}

export function GoalEditor(props: GoalEditorProps) {
  const { goal, index, canRemove } = props
  const alternatives = useProjectStore((state) => state.project.alternatives)
  const renameGoal = useProjectStore((state) => state.renameGoal)
  const removeGoal = useProjectStore((state) => state.removeGoal)
  const addGroup = useProjectStore((state) => state.addGroup)

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3">
        <span className="rounded-md bg-primary/10 px-2 py-1 text-sm font-semibold text-primary">G{index + 1}</span>
        <Input
          value={goal.name}
          onChange={(event) => renameGoal(goal.id, event.target.value)}
          className="max-w-md font-semibold"
        />
        <Button
          variant="ghost"
          size="icon"
          aria-label="Видалити ціль"
          disabled={!canRemove}
          onClick={() => removeGoal(goal.id)}
          className="ml-auto"
        >
          <Trash2 />
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {goal.groups.map((group) => (
          <GroupEditor
            key={group.id}
            goalId={goal.id}
            group={group}
            alternatives={alternatives}
            canRemove={goal.groups.length > 1}
          />
        ))}
        <Button variant="outline" className="w-fit" onClick={() => addGroup(goal.id)}>
          <Plus />
          Додати групу критеріїв
        </Button>
      </CardContent>
    </Card>
  )
}
