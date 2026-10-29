import { useAnalysis, useIssues } from '@/app/useAnalysis'
import { useResultMeta } from '@/app/useResultMeta'
import { type Issue, issuesForRoute } from '@/app/validation'
import { IssueList } from '@/components/app/IssueList'
import { PageHeader } from '@/components/app/PageHeader'
import { SegmentedControl } from '@/components/app/SegmentedControl'
import { Card } from '@/components/ui/card'
import type { InputMode, Project } from '@/core/model'
import { useProjectStore } from '@/store/projectStore'
import { type GoalTreeSelection, useUiStore } from '@/store/uiStore'
import { DirectScoresEditor } from './DirectScoresEditor'
import { GoalEditor } from './GoalEditor'
import { GoalTree } from './GoalTree'
import { GroupEditor } from './GroupEditor'

const MODE_OPTIONS = [
  { value: 'criteria' as const, label: 'Матриці критеріїв' },
  { value: 'direct' as const, label: 'Готові оцінки' },
]

function resolveSelection(project: Project, selection: GoalTreeSelection | null): GoalTreeSelection | null {
  if (selection) {
    const goal = project.goals.find((item) => item.id === selection.goalId)
    if (goal && selection.kind === 'goal') return selection
    if (goal && selection.kind === 'group' && goal.groups.some((group) => group.id === selection.groupId)) {
      return project.inputMode === 'criteria' ? selection : { kind: 'goal', goalId: goal.id }
    }
  }
  const first = project.goals[0]
  if (!first) return null
  const firstGroup = first.groups[0]
  if (project.inputMode === 'criteria' && firstGroup) return { kind: 'group', goalId: first.id, groupId: firstGroup.id }
  return { kind: 'goal', goalId: first.id }
}

function focusCriterionRow(row: number): void {
  requestAnimationFrame(() => {
    const target = document.querySelector(`[data-grid-row="${row}"][data-grid-col="0"]`)
    if (target instanceof HTMLInputElement) {
      target.focus()
      target.select()
    }
  })
}

export function GoalsPage() {
  const project = useProjectStore((state) => state.project)
  const setInputMode = useProjectStore((state) => state.setInputMode)
  const addGoal = useProjectStore((state) => state.addGoal)
  const addGroup = useProjectStore((state) => state.addGroup)
  const analysis = useAnalysis()
  const meta = useResultMeta(project, analysis)
  const issues = issuesForRoute(useIssues(), 'goals')
  const storedSelection = useUiStore((state) => state.treeSelection)
  const selectTree = useUiStore((state) => state.selectTree)
  const selection = resolveSelection(project, storedSelection)
  const criteriaMode = project.inputMode === 'criteria'

  const selectIssue = (issue: Issue) => {
    if (issue.goalId && issue.groupId) selectTree({ kind: 'group', goalId: issue.goalId, groupId: issue.groupId })
    else if (issue.goalId) selectTree({ kind: 'goal', goalId: issue.goalId })
  }

  let editor = null
  if (selection) {
    const goalIndex = project.goals.findIndex((goal) => goal.id === selection.goalId)
    const goal = project.goals[goalIndex]
    const aggregation = analysis.goals[goalIndex] ?? null
    if (goal && selection.kind === 'group' && criteriaMode) {
      const groupIndex = goal.groups.findIndex((group) => group.id === selection.groupId)
      const group = goal.groups[groupIndex]
      const resultIndex = goal.groups.slice(0, groupIndex).filter((item) => item.criteria.length > 0).length
      const weights = group && group.criteria.length > 0 ? (aggregation?.groups[resultIndex]?.criteriaWeights ?? null) : null
      if (group) {
        editor = (
          <GroupEditor
            key={group.id}
            goalId={goal.id}
            goalLabel={`G${goalIndex + 1}`}
            group={group}
            groupIndex={groupIndex}
            alternatives={project.alternatives}
            colorById={meta.colorById}
            criteriaWeights={weights}
            canRemove={goal.groups.length > 1}
            onRemoved={() => selectTree({ kind: 'goal', goalId: goal.id })}
          />
        )
      }
    } else if (goal) {
      editor = (
        <GoalEditor
          key={goal.id}
          goal={goal}
          goalIndex={goalIndex}
          alternatives={project.alternatives}
          colorById={meta.colorById}
          aggregation={aggregation}
          goalScores={analysis.alternatives.map((alt) => alt.goalScores[goalIndex] ?? 0)}
          canRemove={project.goals.length > 1}
          showGroups={criteriaMode}
          onOpenGroup={(groupId) => selectTree({ kind: 'group', goalId: goal.id, groupId })}
          onRemoved={() => selectTree(null)}
        />
      )
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Цілі та критерії"
        description={
          criteriaMode
            ? 'Ієрархія «ціль → група → критерій». Значення критеріїв переводяться у функції належності й агрегуються методом множення матриць.'
            : 'Альтернативи одразу задано координатами в просторі цілей, як у прикладі зі статті.'
        }
        actions={
          <SegmentedControl<InputMode>
            ariaLabel="Спосіб введення даних"
            value={project.inputMode}
            options={MODE_OPTIONS}
            onChange={setInputMode}
          />
        }
      />

      <IssueList issues={issues} onSelect={selectIssue} />

      {criteriaMode ? (
        <div className="grid items-start gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
          <Card className="p-2 lg:sticky lg:top-20">
            <GoalTree
              goals={project.goals}
              selection={selection ?? { kind: 'goal', goalId: '' }}
              issues={issues}
              showGroups
              onSelect={selectTree}
              onSelectCriterion={(goalId, groupId, criterionIndex) => {
                selectTree({ kind: 'group', goalId, groupId })
                focusCriterionRow(criterionIndex)
              }}
              onAddGoal={() => {
                const goalId = addGoal()
                selectTree({ kind: 'goal', goalId })
              }}
              onAddGroup={(goalId) => selectTree({ kind: 'group', goalId, groupId: addGroup(goalId) })}
            />
          </Card>
          <Card className="min-w-0 p-5">{editor}</Card>
        </div>
      ) : (
        <Card className="p-5">
          <DirectScoresEditor project={project} colorById={meta.colorById} />
        </Card>
      )}
    </div>
  )
}
