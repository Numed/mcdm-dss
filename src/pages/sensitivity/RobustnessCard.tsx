import { ROBUSTNESS_RUNS, useRobustness } from '@/app/useAnalysis'
import { AltDot } from '@/components/app/AltDot'
import { Callout } from '@/components/app/Callout'
import { type SegmentOption, SegmentedControl } from '@/components/app/SegmentedControl'
import { RankAcceptability } from '@/components/charts/RankAcceptability'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { RobustnessResult } from '@/core/robustness'
import { formatPercent } from '@/lib/utils'
import { useUiStore } from '@/store/uiStore'

type RobustnessCardProps = {
  nameById: Map<string, string>
  colorById: Map<string, string>
}

type NoiseLevel = '0.05' | '0.1' | '0.2' | '0.3' | '0.5'

const NOISE_OPTIONS: SegmentOption<NoiseLevel>[] = [
  { value: '0.05', label: '±5 %' },
  { value: '0.1', label: '±10 %' },
  { value: '0.2', label: '±20 %' },
  { value: '0.3', label: '±30 %' },
  { value: '0.5', label: '±50 %' },
]

function isNoiseLevel(value: string): value is NoiseLevel {
  return NOISE_OPTIONS.some((option) => option.value === value)
}

function verdict(rate: number): string {
  if (rate >= 0.95) return 'рішення дуже стійке'
  if (rate >= 0.8) return 'рішення стійке'
  if (rate >= 0.6) return 'рішення помірно стійке'
  return 'рішення нестійке, переможець залежить від точності даних'
}

function runnerUp(result: RobustnessResult): string | null {
  const sorted = [...result.alternatives].sort((a, b) => b.winShare - a.winShare)
  const candidate = sorted.find((item) => item.id !== result.baselineWinnerId && item.winShare > 0)
  return candidate?.id ?? null
}

export function RobustnessCard(props: RobustnessCardProps) {
  const { nameById, colorById } = props
  const noise = useUiStore((state) => state.robustnessNoise)
  const setNoise = useUiStore((state) => state.setRobustnessNoise)
  const result = useRobustness(noise)
  const winnerId = result.baselineWinnerId
  const challenger = runnerUp(result)
  const challengerShare = result.alternatives.find((item) => item.id === challenger)?.winShare ?? 0
  const noiseValue = String(noise)

  return (
    <Card>
      <CardHeader>
        <div className="min-w-0">
          <CardTitle>Стійкість до похибок даних</CardTitle>
          <CardDescription>
            Метод Монте-Карло: {ROBUSTNESS_RUNS} сценаріїв, у кожному всі вхідні значення випадково змінено в межах похибки.
            Результат відтворюваний (фіксоване зерно).
          </CardDescription>
        </div>
        <CardAction>
          <SegmentedControl<NoiseLevel>
            ariaLabel="Похибка вхідних даних"
            value={isNoiseLevel(noiseValue) ? noiseValue : '0.1'}
            options={NOISE_OPTIONS}
            onChange={(value) => setNoise(Number(value))}
          />
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <div className="flex flex-col gap-3 lg:border-r lg:pr-6">
          {winnerId ? (
            <>
              <div className="eyebrow">Переможець зберігається</div>
              <div className="text-[44px] leading-[48px] font-semibold tracking-[-0.03em] num">
                {formatPercent(result.baselineWinRate, 1)}
              </div>
              <div className="flex items-center gap-2 text-[13px]">
                <AltDot color={colorById.get(winnerId) ?? 'var(--primary)'} />
                <span>
                  «{nameById.get(winnerId)}» перемагає в {Math.round(result.baselineWinRate * ROBUSTNESS_RUNS)} з{'\u00a0'}
                  {ROBUSTNESS_RUNS} сценаріїв за похибки ±{Math.round(noise * 100)}{'\u00a0'}%
                </span>
              </div>
            </>
          ) : (
            <div className="text-[13px] text-muted-foreground">Немає базового переможця: жодна альтернатива не проходить поріг безпеки.</div>
          )}
        </div>
        <RankAcceptability result={result} nameById={nameById} colorById={colorById} />
      </CardContent>
      {winnerId && (
        <div className="px-5 pb-5">
          <Callout title="Висновок">
            За похибки вхідних даних ±{Math.round(noise * 100)}{'\u00a0'}% {verdict(result.baselineWinRate)}.
            {challenger
              ? ` Найближчий конкурент — «${nameById.get(challenger)}», який виграє в ${formatPercent(challengerShare)} сценаріїв.`
              : ' Жодна інша альтернатива не виходить на перше місце.'}
          </Callout>
        </div>
      )}
    </Card>
  )
}
