import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useProjectStore } from '@/store/projectStore'

export function AlternativesCard() {
  const alternatives = useProjectStore((state) => state.project.alternatives)
  const addAlternative = useProjectStore((state) => state.addAlternative)
  const renameAlternative = useProjectStore((state) => state.renameAlternative)
  const removeAlternative = useProjectStore((state) => state.removeAlternative)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Альтернативи</CardTitle>
        <CardDescription>Множина X = {'{'}x₁, ..., xₙ{'}'}, з якої обирається найкращий варіант</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {alternatives.map((alternative, index) => (
          <div key={alternative.id} className="flex items-center gap-2">
            <span className="w-8 text-sm text-muted-foreground tabular-nums">x{index + 1}</span>
            <Input value={alternative.name} onChange={(event) => renameAlternative(alternative.id, event.target.value)} />
            <Button
              variant="ghost"
              size="icon"
              aria-label="Видалити альтернативу"
              disabled={alternatives.length <= 2}
              onClick={() => removeAlternative(alternative.id)}
            >
              <Trash2 />
            </Button>
          </div>
        ))}
        <Button variant="outline" className="mt-1 w-fit" onClick={addAlternative}>
          <Plus />
          Додати альтернативу
        </Button>
      </CardContent>
    </Card>
  )
}
