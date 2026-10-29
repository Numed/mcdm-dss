import { useState } from 'react'
import { useElementSize } from '@/app/useElementSize'
import { AltDot } from '@/components/app/AltDot'
import type { AlternativeResult } from '@/core/analysis'
import type { Vector } from '@/core/matrix'
import type { SecurityLevel } from '@/core/security'
import { securityColorVar } from '@/lib/colors'
import type { DisplayRank } from '@/lib/ranking'
import { formatNumber } from '@/lib/utils'
import { ChartLegend, type LegendItem } from './ChartLegend'
import { ChartTooltip } from './ChartTooltip'
import { PointTooltip } from './GoalSpaceChart'

type RadarChartProps = {
  alternatives: AlternativeResult[]
  colorById: Map<string, string>
  rankById: Map<string, DisplayRank>
  target: Vector
  goalNames: string[]
  maxSize?: number
}

type Point = {
  x: number
  y: number
}

const RINGS: SecurityLevel[] = [5, 4, 3, 2, 1]
const PADDING = 72

function polygonPath(points: Point[]): string {
  return `${points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')} Z`
}

function labelAnchor(x: number, center: number): 'start' | 'middle' | 'end' {
  if (Math.abs(x - center) < 4) return 'middle'
  if (x > center) return 'start'
  return 'end'
}

function polygonOpacity(active: boolean, anyHovered: boolean): number {
  if (active) return 0.22
  if (anyHovered) return 0.02
  return 0.06
}

export function RadarChart(props: RadarChartProps) {
  const { alternatives, colorById, rankById, target, goalNames, maxSize = 520 } = props
  const { ref, size } = useElementSize<HTMLDivElement>()
  const [hovered, setHovered] = useState<string | null>(null)
  const side = Math.max(Math.min(size.width, maxSize), 260)
  const radius = side / 2 - PADDING
  const center = side / 2
  const count = goalNames.length

  const project = (index: number, value: number): Point => {
    const angle = -Math.PI / 2 + (index / count) * Math.PI * 2
    return { x: center + Math.cos(angle) * radius * value, y: center + Math.sin(angle) * radius * value }
  }
  const ring = (value: number) => polygonPath(goalNames.map((_, index) => project(index, value)))
  const hoveredAlt = alternatives.find((alt) => alt.id === hovered) ?? null
  const passing = alternatives.filter((alt) => alt.passesSecurity)

  const legendItems: LegendItem[] = alternatives.map((alt) => ({
    key: alt.id,
    label: alt.name,
    muted: !alt.passesSecurity,
    swatch: <AltDot color={alt.passesSecurity ? (colorById.get(alt.id) ?? 'var(--primary)') : 'var(--muted-foreground)'} />,
  }))

  return (
    <div className="flex flex-col gap-4">
      <div ref={ref} className="relative flex w-full justify-center" style={{ height: side }}>
        {size.width > 0 && (
          <svg width={side} height={side} role="img" aria-label="Пелюсткова діаграма оцінок за цілями" className="text-[11px]">
            {RINGS.map((level) => (
              <path
                key={level}
                d={ring(level * 0.2)}
                style={{ fill: `color-mix(in srgb, ${securityColorVar(level)} ${7 + level * 2}%, var(--card))` }}
                stroke="var(--foreground)"
                strokeOpacity={0.08}
              />
            ))}
            {goalNames.map((name, index) => {
              const end = project(index, 1)
              const labelPoint = project(index, 1.14)
              const anchor = labelAnchor(labelPoint.x, center)
              return (
                <g key={name}>
                  <line x1={center} y1={center} x2={end.x} y2={end.y} stroke="var(--foreground)" strokeOpacity={0.12} />
                  <text x={labelPoint.x} y={labelPoint.y + 4} textAnchor={anchor} fontWeight={500} fill="var(--foreground)">
                    G{index + 1}
                  </text>
                </g>
              )
            })}
            {[0.2, 0.4, 0.6, 0.8, 1].map((value) => {
              const point = project(0, value)
              return (
                <text key={value} x={point.x + 4} y={point.y + 3} fontSize={9} fill="var(--muted-foreground)" className="num">
                  {formatNumber(value, 1)}
                </text>
              )
            })}
            {passing.map((alt) => {
              const color = colorById.get(alt.id) ?? 'var(--primary)'
              const active = hovered === alt.id
              const path = polygonPath(alt.goalScores.map((value, index) => project(index, value)))
              return (
                <path
                  key={alt.id}
                  d={path}
                  fill={color}
                  fillOpacity={polygonOpacity(active, hovered !== null)}
                  stroke={color}
                  strokeOpacity={hovered !== null && !active ? 0.25 : 1}
                  strokeWidth={active ? 2.25 : 1.5}
                  strokeLinejoin="round"
                  onMouseEnter={() => setHovered(alt.id)}
                  onMouseLeave={() => setHovered(null)}
                  className="cursor-pointer"
                />
              )
            })}
            <path
              d={polygonPath(target.map((value, index) => project(index, value)))}
              fill="none"
              stroke="var(--foreground)"
              strokeWidth={1.75}
              strokeDasharray="5 4"
            />
            {target.map((value, index) => {
              const point = project(index, value)
              return (
                <rect
                  key={index}
                  x={point.x - 4}
                  y={point.y - 4}
                  width={8}
                  height={8}
                  transform={`rotate(45 ${point.x} ${point.y})`}
                  fill="var(--foreground)"
                  stroke="var(--card)"
                  strokeWidth={1.5}
                />
              )
            })}
          </svg>
        )}
        {hoveredAlt && (
          <ChartTooltip x={size.width / 2 + side / 4} y={24} containerWidth={size.width}>
            <PointTooltip
              alternative={hoveredAlt}
              color={colorById.get(hoveredAlt.id) ?? 'var(--primary)'}
              rank={rankById.get(hoveredAlt.id) ?? null}
              goalNames={goalNames}
            />
          </ChartTooltip>
        )}
      </div>
      <div className="flex flex-col gap-2 border-t pt-3">
        <ChartLegend items={legendItems} activeKey={hovered} onHover={setHovered} />
        <ol className="grid gap-x-6 gap-y-0.5 text-xs text-muted-foreground sm:grid-cols-2">
          {goalNames.map((name, index) => (
            <li key={name} className="truncate">
              <span className="font-medium text-foreground">G{index + 1}</span> {name}
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
