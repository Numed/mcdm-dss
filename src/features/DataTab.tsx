import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useProjectStore } from '@/store/projectStore'
import { AlternativesCard } from './AlternativesCard'
import { DirectScoresCard } from './DirectScoresCard'
import { GoalEditor } from './GoalEditor'
import { cn } from '@/lib/utils'

type ModeOptionProps = {
  active: boolean
  title: string
  description: string
  onSelect: () => void
}

function ModeOption(props: ModeOptionProps) {
  const { active, title, description, onSelect } = props
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex-1 cursor-pointer rounded-lg border p-3 text-left transition-colors',
        active ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted/60',
      )}
    >
      <div className="text-sm font-medium">{title}</div>
      <div className="mt-1 text-xs text-muted-foreground">{description}</div>
    </button>
  )
}

export function DataTab() {
  const project = useProjectStore((state) => state.project)
  const setInputMode = useProjectStore((state) => state.setInputMode)
  const addGoal = useProjectStore((state) => state.addGoal)

  return (
    <div className="flex flex-col gap-4">
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <AlternativesCard />
        <Card>
          <CardHeader>
            <CardTitle>Спосіб введення даних</CardTitle>
            <CardDescription>Від цього залежить, чи виконується агрегування за групами критеріїв</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <ModeOption
              active={project.inputMode === 'criteria'}
              title="Матриці рішень за групами критеріїв"
              description="Кількісні значення критеріїв приводяться до функцій належності, далі дворівневе агрегування методом множення матриць"
              onSelect={() => setInputMode('criteria')}
            />
            <ModeOption
              active={project.inputMode === 'direct'}
              title="Готові оцінки за цілями"
              description="Одразу задаються координати альтернатив у просторі цілей, як у прикладі зі статті"
              onSelect={() => setInputMode('direct')}
            />
          </CardContent>
        </Card>
      </div>

      {project.inputMode === 'direct' && <DirectScoresCard />}
      {project.inputMode === 'criteria' &&
        project.goals.map((goal, index) => (
          <GoalEditor key={goal.id} goal={goal} index={index} canRemove={project.goals.length > 1} />
        ))}

      <Button variant="outline" className="w-fit" onClick={addGoal}>
        <Plus />
        Додати ціль
      </Button>
    </div>
  )
}
