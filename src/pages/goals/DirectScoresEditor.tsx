import { Plus } from 'lucide-react'
import type { ClipboardEvent } from 'react'
import { notifyPaste } from '@/app/notify'
import { AltDot } from '@/components/app/AltDot'
import { GridNumberCell, GridTextCell } from '@/components/app/DataGrid'
import { Button } from '@/components/ui/button'
import type { Project } from '@/core/model'
import { SATISFACTION_TERMS } from '@/core/satisfaction'
import { readGridPosition, useGridKeys } from '@/lib/grid'
import { parseClipboardGrid } from '@/lib/parse'
import { formatNumber } from '@/lib/utils'
import { useProjectStore } from '@/store/projectStore'

type DirectScoresEditorProps = {
  project: Project
  colorById: Map<string, string>
}

export function DirectScoresEditor(props: DirectScoresEditorProps) {
  const { project, colorById } = props
  const setDirectScore = useProjectStore((state) => state.setDirectScore)
  const renameGoal = useProjectStore((state) => state.renameGoal)
  const pasteDirectScores = useProjectStore((state) => state.pasteDirectScores)
  const addGoal = useProjectStore((state) => state.addGoal)
  const onGridKeys = useGridKeys()

  const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
    const position = readGridPosition(event.target)
    if (!position || position.col === 0) return
    const rows = parseClipboardGrid(event.clipboardData.getData('text/plain'))
    if (rows.length <= 1 && (rows[0]?.length ?? 0) <= 1) return
    event.preventDefault()
    notifyPaste(pasteDirectScores(position.row, position.col - 1, rows))
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-auto rounded-lg border bg-card" onKeyDown={onGridKeys} onPaste={handlePaste}>
        <table className="w-full border-separate border-spacing-0 text-[13px]">
          <thead>
            <tr>
              <th className="sticky top-0 left-0 z-30 min-w-64 border-r border-b bg-muted px-3 py-2 text-left eyebrow">Ціль</th>
              <th className="sticky top-0 z-20 border-b bg-muted px-3 py-2 text-right eyebrow normal-case">t</th>
              {project.alternatives.map((alternative) => (
                <th key={alternative.id} className="sticky top-0 z-20 min-w-28 border-b bg-muted px-3 py-2 text-right">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                    <AltDot color={colorById.get(alternative.id) ?? 'var(--primary)'} />
                    {alternative.name}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {project.goals.map((goal, rowIndex) => (
              <tr key={goal.id}>
                <td className="sticky left-0 z-10 border-r border-b bg-card p-0">
                  <div className="flex items-center">
                    <span className="w-9 shrink-0 pl-3 text-xs font-semibold text-primary num">G{rowIndex + 1}</span>
                    <GridTextCell
                      row={rowIndex}
                      col={0}
                      value={goal.name}
                      ariaLabel={`Назва цілі G${rowIndex + 1}`}
                      onCommit={(name) => renameGoal(goal.id, name)}
                      className="pl-1"
                    />
                  </div>
                </td>
                <td className="border-b px-3 text-right text-muted-foreground num">
                  {formatNumber(SATISFACTION_TERMS[goal.satisfactionTerm]?.value ?? 0, 1)}
                </td>
                {project.alternatives.map((alternative, columnIndex) => (
                  <td key={alternative.id} className="border-b p-0">
                    <GridNumberCell
                      row={rowIndex}
                      col={columnIndex + 1}
                      value={goal.directScores[alternative.id]}
                      min={0}
                      max={1}
                      ariaLabel={`${goal.name}: ${alternative.name}`}
                      onCommit={(value) => setDirectScore(goal.id, alternative.id, value)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button variant="outline" size="sm" className="w-fit" onClick={() => addGoal()}>
        <Plus />
        Додати ціль
      </Button>
      <p className="text-xs text-muted-foreground">
        Значення з [0; 1], отримані раніше будь-яким методом. Агрегування за групами критеріїв пропускається. Вставка з Excel
        працює так само, як у матрицях критеріїв.
      </p>
    </div>
  )
}
