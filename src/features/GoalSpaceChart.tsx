import type { AlternativeResult } from '@/core/analysis'
import type { Vector } from '@/core/matrix'
import type { SecurityLevel } from '@/core/security'
import { formatNumber } from '@/lib/utils'

type GoalSpaceChartProps = {
  alternatives: AlternativeResult[]
  target: Vector
  goalNames: string[]
  minSecurityLevel: SecurityLevel
}

const SIZE = 420
const PADDING = 44
const PLOT = SIZE - PADDING * 2
const TICKS = [0, 0.2, 0.4, 0.6, 0.8, 1]
const ZONE_OPACITY = [0.04, 0.07, 0.1, 0.14, 0.19]

function toX(value: number): number {
  return PADDING + value * PLOT
}

function toY(value: number): number {
  return SIZE - PADDING - value * PLOT
}

export function GoalSpaceChart(props: GoalSpaceChartProps) {
  const { alternatives, target, goalNames, minSecurityLevel } = props
  const threshold = (minSecurityLevel - 1) * 0.2

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full max-w-[460px]" role="img" aria-label="Простір цілей">
      {ZONE_OPACITY.map((opacity, index) => {
        const start = index * 0.2
        return (
          <rect
            key={start}
            x={toX(start)}
            y={toY(1)}
            width={(1 - start) * PLOT}
            height={(1 - start) * PLOT}
            fill="var(--primary)"
            fillOpacity={opacity}
          />
        )
      })}
      {threshold > 0 && (
        <path
          d={`M ${toX(threshold)} ${toY(1)} L ${toX(threshold)} ${toY(threshold)} L ${toX(1)} ${toY(threshold)}`}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={1.5}
          strokeDasharray="5 4"
        />
      )}
      {TICKS.map((tick) => (
        <g key={tick}>
          <line x1={toX(tick)} x2={toX(tick)} y1={toY(0)} y2={toY(1)} stroke="var(--border)" />
          <line x1={toX(0)} x2={toX(1)} y1={toY(tick)} y2={toY(tick)} stroke="var(--border)" />
          <text x={toX(tick)} y={toY(0) + 16} textAnchor="middle" fontSize={11} fill="var(--muted-foreground)">
            {formatNumber(tick, 1)}
          </text>
          <text x={toX(0) - 8} y={toY(tick) + 4} textAnchor="end" fontSize={11} fill="var(--muted-foreground)">
            {formatNumber(tick, 1)}
          </text>
        </g>
      ))}
      {[1, 2, 3, 4, 5].map((level) => (
        <text
          key={level}
          x={toX(1) - 4}
          y={toY((level - 1) * 0.2) - 4}
          textAnchor="end"
          fontSize={10}
          fill="var(--primary)"
          fillOpacity={0.7}
        >
          B{level}
        </text>
      ))}
      <text x={toX(0.5)} y={SIZE - 6} textAnchor="middle" fontSize={12} fill="var(--foreground)">
        {goalNames[0]}
      </text>
      <text
        x={12}
        y={toY(0.5)}
        textAnchor="middle"
        fontSize={12}
        fill="var(--foreground)"
        transform={`rotate(-90 12 ${toY(0.5)})`}
      >
        {goalNames[1]}
      </text>

      {alternatives.map((alt) => {
        const [x, y] = alt.goalScores
        const best = alt.rank === 1
        return (
          <g key={alt.id}>
            <circle
              cx={toX(x)}
              cy={toY(y)}
              r={best ? 7 : 5.5}
              fill={alt.passesSecurity ? 'var(--primary)' : 'var(--background)'}
              stroke={alt.passesSecurity ? 'var(--background)' : 'var(--muted-foreground)'}
              strokeWidth={alt.passesSecurity ? 2 : 1.5}
            />
            <text
              x={toX(x) + 9}
              y={toY(y) - 7}
              fontSize={11}
              fontWeight={best ? 600 : 400}
              fill={alt.passesSecurity ? 'var(--foreground)' : 'var(--muted-foreground)'}
            >
              {alt.name}
            </text>
          </g>
        )
      })}

      <g>
        <rect
          x={toX(target[0]) - 6}
          y={toY(target[1]) - 6}
          width={12}
          height={12}
          transform={`rotate(45 ${toX(target[0])} ${toY(target[1])})`}
          fill="var(--warning)"
          stroke="var(--foreground)"
          strokeWidth={1}
        />
        <text x={toX(target[0]) + 10} y={toY(target[1]) + 16} fontSize={11} fontWeight={600} fill="var(--foreground)">
          T
        </text>
      </g>
    </svg>
  )
}
