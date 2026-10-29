import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { GOAL_NORMALIZATION_LABELS, type GoalNormalization } from '@/core/goals'
import { POWER_MEAN_LABELS, type PowerMeanOrder } from '@/core/matrixMethod'
import { SATISFACTION_TERMS } from '@/core/satisfaction'
import { SECURITY_LEVELS } from '@/core/security'
import { formatNumber } from '@/lib/utils'
import { useProjectStore } from '@/store/projectStore'

const POWER_MEAN_ORDERS: PowerMeanOrder[] = [-1, 0, 1, 2]
const NORMALIZATIONS: GoalNormalization[] = ['max', 'sum']

export function ParamsTab() {
  const project = useProjectStore((state) => state.project)
  const setPowerMeanOrder = useProjectStore((state) => state.setPowerMeanOrder)
  const setGoalNormalization = useProjectStore((state) => state.setGoalNormalization)
  const setMinSecurityLevel = useProjectStore((state) => state.setMinSecurityLevel)
  const setSatisfactionTerm = useProjectStore((state) => state.setSatisfactionTerm)
  const criteriaMode = project.inputMode === 'criteria'

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>«Вектор задоволення» T</CardTitle>
          <CardDescription>
            Уявна альтернатива, яка влаштувала б особу, що приймає рішення (ОПР). Задається лінгвістично для кожної цілі
            і одночасно визначає вагу цілі під час ранжування.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {project.goals.map((goal, index) => (
            <div key={goal.id} className="grid gap-2 sm:grid-cols-[1fr_16rem] sm:items-center">
              <Label htmlFor={`term-${goal.id}`}>
                <span className="text-primary">G{index + 1}</span>
                {goal.name}
              </Label>
              <Select
                value={String(goal.satisfactionTerm)}
                onValueChange={(value) => setSatisfactionTerm(goal.id, Number(value))}
              >
                <SelectTrigger id={`term-${goal.id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SATISFACTION_TERMS.map((term, termIndex) => (
                    <SelectItem key={term.label} value={String(termIndex)}>
                      {term.label} ({formatNumber(term.value, 1)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
          <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
            Правило: «Якщо потреба за ціллю Gᵢ = a, тоді tᵢ = u». Отримуємо T = (
            {project.goals.map((goal) => formatNumber(SATISFACTION_TERMS[goal.satisfactionTerm]?.value ?? 0, 1)).join('; ')}).
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Критерій безпеки вибору</CardTitle>
          <CardDescription>
            Рівень альтернативи визначається її найслабшою координатою в просторі цілей. Альтернативи нижче порогу
            відсіюються до ранжування.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {SECURITY_LEVELS.map((item) => (
            <label
              key={item.level}
              className="flex cursor-pointer items-center gap-3 rounded-md border p-2.5 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5"
            >
              <input
                type="radio"
                name="security"
                className="accent-[var(--primary)]"
                checked={project.minSecurityLevel === item.level}
                onChange={() => setMinSecurityLevel(item.level)}
              />
              <span className="w-8 font-medium">B{item.level}</span>
              <span className="flex-1">{item.label}</span>
              <span className="text-muted-foreground tabular-nums">{item.range}</span>
            </label>
          ))}
          <p className="text-xs text-muted-foreground">Обраний поріг: допускаються альтернативи з рівнем B{project.minSecurityLevel} і вище.</p>
        </CardContent>
      </Card>

      <Card className={criteriaMode ? '' : 'opacity-60'}>
        <CardHeader>
          <CardTitle>Метод множення матриць</CardTitle>
          <CardDescription>
            {criteriaMode
              ? 'Параметри агрегування оцінок за групами критеріїв і за цілями'
              : 'Не використовується в режимі готових оцінок за цілями'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="power-mean">Середнє порядку t для важливості критеріїв</Label>
            <Select
              disabled={!criteriaMode}
              value={String(project.powerMeanOrder)}
              onValueChange={(value) => {
                const order = POWER_MEAN_ORDERS.find((item) => String(item) === value)
                if (order !== undefined) setPowerMeanOrder(order)
              }}
            >
              <SelectTrigger id="power-mean">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POWER_MEAN_ORDERS.map((order) => (
                  <SelectItem key={order} value={String(order)}>
                    {POWER_MEAN_LABELS[order]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Менше t дає «песимістичнішу» оцінку важливості, більше t посилює вплив найсильніших зв'язків між критеріями.
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="normalization">Нормування вектора оцінок за ціллю</Label>
            <Select
              disabled={!criteriaMode}
              value={project.goalNormalization}
              onValueChange={(value) => {
                const normalization = NORMALIZATIONS.find((item) => item === value)
                if (normalization) setGoalNormalization(normalization)
              }}
            >
              <SelectTrigger id="normalization">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NORMALIZATIONS.map((item) => (
                  <SelectItem key={item} value={item}>
                    {GOAL_NORMALIZATION_LABELS[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Нормування за максимумом переводить оцінки в шкалу [0; 1], співставну з рівнями безпеки та вектором
              задоволення.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
