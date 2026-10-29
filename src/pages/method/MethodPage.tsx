import { BookOpen } from 'lucide-react'
import type { ReactNode } from 'react'
import { FORMULAS, type FormulaId, SOURCE_REFERENCE } from '@/app/formulas'
import { PageHeader } from '@/components/app/PageHeader'
import { Formula, Tex } from '@/components/app/Tex'
import { Card } from '@/components/ui/card'
import { SATISFACTION_TERMS } from '@/core/satisfaction'
import { SECURITY_LEVELS } from '@/core/security'
import { formatNumber } from '@/lib/utils'

type MethodStep = {
  id: string
  title: string
  body: ReactNode
  formulas: FormulaId[]
}

const STEPS: MethodStep[] = [
  {
    id: 'task',
    title: 'Постановка задачі',
    body: (
      <>
        Задано множину альтернатив <Tex math="X = \{x_1, \dots, x_n\}" /> і множину цілей <Tex math="G = \{G_1, \dots, G_L\}" />.
        Кожна ціль описується групами кількісних критеріїв <Tex math="S_{l1}, \dots, S_{lp}" />. Потрібно знайти альтернативу,
        яка найкраще задовольняє потреби ОПР за всіма цілями одночасно і водночас є безпечною, тобто не має провальної оцінки
        за жодною з цілей.
      </>
    ),
    formulas: [],
  },
  {
    id: 'membership',
    title: 'Функції належності',
    body: (
      <>
        Значення критеріїв мають різні одиниці виміру, тому спершу їх переводять у шкалу [0; 1]. Для критеріїв, які
        потрібно максимізувати, використовують відношення до найкращого значення, для критеріїв мінімізації навпаки.
      </>
    ),
    formulas: ['benefit', 'cost'],
  },
  {
    id: 'matrix',
    title: 'Метод множення матриць',
    body: (
      <>
        Для кожної групи будують матрицю рішень A з функцій належності. Добуток <Tex math="A \cdot A^{\mathsf T}" /> описує
        зв’язки між критеріями, середнє порядку t по рядках дає їхню важливість, а нормування дає ваги W без попарних
        порівнянь експертів. Зважена матриця B і добуток C дають вектор оцінок альтернатив r за групою.
      </>
    ),
    formulas: ['decision', 'relation', 'powerMean', 'weights', 'weighted', 'alternativesRelation', 'scores'],
  },
  {
    id: 'goals',
    title: 'Агрегування за цілями',
    body: (
      <>
        Вектори оцінок груп однієї цілі утворюють нову матрицю рішень, до якої знову застосовують метод множення матриць.
        Так отримують ваги груп і оцінку альтернативи за ціллю. Щоб оцінки були співставні з рівнями безпеки і вектором
        задоволення, їх нормують за максимумом.
      </>
    ),
    formulas: ['goalNormalization'],
  },
  {
    id: 'security',
    title: 'Критерій безпеки',
    body: (
      <>
        Кожна альтернатива стає точкою <Tex math="(g_{i1}, \dots, g_{iL})" /> у просторі цілей. Рівень безпеки визначає
        найслабша координата: альтернатива, яка чудова за однією ціллю і провальна за іншою, вважається ризикованою.
        Альтернативи нижче обраного порогу відсіюються.
      </>
    ),
    formulas: ['security'],
  },
  {
    id: 'satisfaction',
    title: 'Вектор задоволення і ранжування',
    body: (
      <>
        ОПР задає потребу за кожною ціллю лінгвістично, а правило «якщо потреба за ціллю <Tex math="G_l" /> = a, то{' '}
        <Tex math="t_l" /> = u» перетворює її на компоненту вектора задоволення T. Далі обчислюють максимальне відхилення m,
        відхилення кожної альтернативи від T і обмежену відстань μ. Оцінки <Tex math="z_{il}" /> зважують компонентами T,
        тож T одночасно задає і бажаний рівень, і вагу цілі. Через це <Tex math="Z^*" /> може перевищувати 1, його максимум
        дорівнює <Tex math="\sum t_l" />.
      </>
    ),
    formulas: ['spread', 'distance', 'closeness', 'z', 'zStar', 'best'],
  },
]

export function MethodPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Про метод"
        description="Кроки інформаційної технології з формулами в нумерації розділу 2 роботи."
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="flex min-w-0 flex-col gap-6">
          {STEPS.map((step, index) => (
            <Card key={step.id} id={step.id} className="scroll-mt-20 p-6">
              <div className="flex items-baseline gap-3">
                <span className="text-sm font-semibold text-primary num">{index + 1}</span>
                <h2 className="text-[17px] leading-6 font-semibold tracking-[-0.01em]">{step.title}</h2>
              </div>
              <p className="mt-3 max-w-3xl text-[14px] leading-6 text-muted-foreground">{step.body}</p>
              {step.formulas.length > 0 && (
                <div className="mt-4 flex flex-col gap-1 rounded-lg border bg-muted/30 px-5 py-3">
                  {step.formulas.map((id) => (
                    <Formula key={id} math={FORMULAS[id].tex} number={FORMULAS[id].number} />
                  ))}
                </div>
              )}
              {step.id === 'security' && (
                <div className="mt-4 grid gap-2 sm:grid-cols-5">
                  {SECURITY_LEVELS.map((level) => (
                    <div key={level.level} className="rounded-md border px-3 py-2 text-xs">
                      <div className="flex items-center gap-1.5 font-semibold">
                        <span className="size-2 rounded-full" style={{ backgroundColor: `var(--sec-${level.level})` }} aria-hidden />B
                        {level.level}
                        <span className="ml-auto font-normal text-muted-foreground num">{level.range}</span>
                      </div>
                      <div className="mt-1 text-muted-foreground">{level.label}</div>
                    </div>
                  ))}
                </div>
              )}
              {step.id === 'satisfaction' && (
                <div className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
                  {SATISFACTION_TERMS.map((term) => (
                    <div key={term.label} className="rounded-md border px-3 py-2 text-xs">
                      <div className="font-semibold num">u = {formatNumber(term.value, 1)}</div>
                      <div className="mt-1 text-muted-foreground">{term.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}

          <Card className="flex-row gap-4 p-6">
            <BookOpen className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
            <div className="flex flex-col gap-2 text-[13px] leading-6">
              <div className="font-semibold">Джерело</div>
              <p className="text-muted-foreground">{SOURCE_REFERENCE}</p>
              <div className="font-semibold">Рішення, прийняті під час реалізації</div>
              <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                <li>Матрицю NA нормовано на кількість альтернатив n; на ваги критеріїв це не впливає, бо середнє порядку t однорідне.</li>
                <li>Середнє порядку t реалізовано як <Tex math="\left(\tfrac{1}{m}\sum x^t\right)^{1/t}" />, для t = 0 — геометричне.</li>
                <li>Оцінки за ціллю за замовчуванням нормуються за максимумом, щоб бути в шкалі [0; 1].</li>
                <li>Для x₅ з прикладу статті формула (2.14) дає μ = (0,3; 0,5) і Z* = 0,68, а не 0,92, як у тексті статті.</li>
              </ul>
            </div>
          </Card>
        </div>

        <nav aria-label="Зміст" className="hidden xl:sticky xl:top-20 xl:block">
          <div className="eyebrow mb-2">Зміст</div>
          <ol className="flex flex-col gap-0.5 border-l text-[13px]">
            {STEPS.map((step, index) => (
              <li key={step.id}>
                <a
                  href={`#method`}
                  onClick={(event) => {
                    event.preventDefault()
                    document.getElementById(step.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }}
                  className="-ml-px block border-l border-transparent py-1 pl-3 text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                >
                  {index + 1}. {step.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </div>
  )
}
