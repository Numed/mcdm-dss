import { type KeyboardEvent, type PointerEvent, useId, useRef, useState } from 'react'
import { useElementSize } from '@/app/useElementSize'
import { AltDot } from '@/components/app/AltDot'
import type { AlternativeResult } from '@/core/analysis'
import type { Vector } from '@/core/matrix'
import { SECURITY_LEVELS, type SecurityLevel } from '@/core/security'
import { securityColorVar } from '@/lib/colors'
import type { DisplayRank } from '@/lib/ranking'
import { formatRank } from '@/lib/ranking'
import { cn, formatFixed, formatNumber, formatVector } from '@/lib/utils'
import { ChartLegend, type LegendItem } from './ChartLegend'
import { ChartTooltip, TooltipRow } from './ChartTooltip'

type GoalSpaceChartProps = {
  alternatives: AlternativeResult[]
  colorById: Map<string, string>
  rankById: Map<string, DisplayRank>
  target: Vector
  goalNames: string[]
  minSecurityLevel: SecurityLevel
  maxPlotSize?: number
  interactive?: boolean
  onTargetChange?: (termX: number, termY: number) => void
}

type Box = {
  x: number
  y: number
  width: number
  height: number
}

type PlacedLabel = {
  id: string
  x: number
  y: number
  anchor: 'start' | 'end' | 'middle'
}

type LabelCandidate = {
  dx: number
  dy: number
  anchor: 'start' | 'end' | 'middle'
}

type Geometry = {
  left: number
  top: number
  plot: number
}

type PointInput = {
  id: string
  label: string
  x: number
  y: number
}

const MARGIN_LEFT = 52
const MARGIN_RIGHT = 20
const MARGIN_TOP = 26
const MARGIN_BOTTOM = 48
const TICKS = [0, 0.2, 0.4, 0.6, 0.8, 1]
const LEVELS: SecurityLevel[] = [1, 2, 3, 4, 5]
const LABEL_HEIGHT = 14
const CHAR_WIDTH = 6.3
const TARGET_ID = '__target__'
const TERM_STEPS = 5
const TERM_TICKS = [0, 1, 2, 3, 4, 5]

const CANDIDATES: LabelCandidate[] = [
  { dx: 10, dy: -8, anchor: 'start' },
  { dx: -10, dy: -8, anchor: 'end' },
  { dx: 10, dy: 15, anchor: 'start' },
  { dx: -10, dy: 15, anchor: 'end' },
  { dx: 0, dy: -13, anchor: 'middle' },
  { dx: 0, dy: 22, anchor: 'middle' },
  { dx: 16, dy: 4, anchor: 'start' },
  { dx: -16, dy: 4, anchor: 'end' },
]

function labelBox(x: number, y: number, text: string, anchor: 'start' | 'end' | 'middle'): Box {
  const width = text.length * CHAR_WIDTH + 4
  let left = x
  if (anchor === 'end') left = x - width
  if (anchor === 'middle') left = x - width / 2
  return { x: left, y: y - LABEL_HEIGHT + 3, width, height: LABEL_HEIGHT }
}

function overlap(a: Box, b: Box): number {
  const width = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)
  const height = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y)
  if (width <= 0 || height <= 0) return 0
  return width * height
}

function placeLabels(points: PointInput[], obstacles: Box[], bounds: Box): PlacedLabel[] {
  const placed: Box[] = []
  const pointBoxes = points.map((point) => ({ x: point.x - 7, y: point.y - 7, width: 14, height: 14 }))
  const result: PlacedLabel[] = []
  for (const point of points) {
    let best: PlacedLabel | null = null
    let bestCost = Number.POSITIVE_INFINITY
    for (const [order, candidate] of CANDIDATES.entries()) {
      const x = point.x + candidate.dx
      const y = point.y + candidate.dy
      const box = labelBox(x, y, point.label, candidate.anchor)
      let cost = order * 0.5
      if (box.x < bounds.x || box.x + box.width > bounds.x + bounds.width) cost += 5000
      if (box.y < bounds.y || box.y + box.height > bounds.y + bounds.height) cost += 5000
      for (const other of placed) cost += overlap(box, other) * 4
      for (const other of pointBoxes) cost += overlap(box, other) * 3
      for (const other of obstacles) cost += overlap(box, other) * 3
      if (cost < bestCost) {
        bestCost = cost
        best = { id: point.id, x, y, anchor: candidate.anchor }
      }
    }
    if (best) {
      placed.push(labelBox(best.x, best.y, point.label, best.anchor))
      result.push(best)
    }
  }
  return result
}

function zoneFill(level: SecurityLevel): string {
  return `color-mix(in srgb, ${securityColorVar(level)} ${7 + level * 2}%, var(--card))`
}

function toTerm(value: number): number {
  return Math.min(TERM_STEPS, Math.max(0, Math.round(value * TERM_STEPS)))
}

function linkOpacity(active: boolean, anyHovered: boolean): number {
  if (active) return 0.95
  if (anyHovered) return 0.12
  return 0.4
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return `${text.slice(0, max - 1)}…`
}

export function GoalSpaceChart(props: GoalSpaceChartProps) {
  const {
    alternatives,
    colorById,
    rankById,
    target,
    goalNames,
    minSecurityLevel,
    maxPlotSize = 460,
    interactive = true,
    onTargetChange,
  } = props
  const { ref, size } = useElementSize<HTMLDivElement>()
  const svgRef = useRef<SVGSVGElement>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const draggable = interactive && onTargetChange !== undefined
  const patternId = useId()

  const available = Math.max(size.width - MARGIN_LEFT - MARGIN_RIGHT, 0)
  const plot = Math.max(Math.min(available, maxPlotSize), 200)
  const geometry: Geometry = { left: MARGIN_LEFT, top: MARGIN_TOP, plot }
  const width = plot + MARGIN_LEFT + MARGIN_RIGHT
  const height = plot + MARGIN_TOP + MARGIN_BOTTOM
  const toX = (value: number) => geometry.left + value * geometry.plot
  const toY = (value: number) => geometry.top + (1 - value) * geometry.plot

  const threshold = (minSecurityLevel - 1) * 0.2
  const [tx, ty] = [target[0] ?? 0, target[1] ?? 0]
  const targetLabel = `T ${formatVector([tx, ty], 1)}`

  const points: PointInput[] = [
    { id: TARGET_ID, label: targetLabel, x: toX(tx), y: toY(ty) },
    ...alternatives
      .map((alt) => ({
        id: alt.id,
        label: alt.name,
        x: toX(alt.goalScores[0] ?? 0),
        y: toY(alt.goalScores[1] ?? 0),
      }))
      .sort((a, b) => a.y - b.y || a.x - b.x),
  ]
  const labels = size.width > 0
    ? placeLabels(points, [], {
        x: geometry.left,
        y: geometry.top,
        width: geometry.plot + MARGIN_RIGHT - 2,
        height: geometry.plot,
      })
    : []
  const labelById = new Map(labels.map((label) => [label.id, label]))
  const targetPlacement = labelById.get(TARGET_ID)
  const hoveredAlt = dragging ? null : (alternatives.find((alt) => alt.id === hovered) ?? null)
  const currentTermX = toTerm(tx)
  const currentTermY = toTerm(ty)

  const moveTarget = (termX: number, termY: number) => {
    const nextX = Math.min(TERM_STEPS, Math.max(0, termX))
    const nextY = Math.min(TERM_STEPS, Math.max(0, termY))
    if (nextX !== currentTermX || nextY !== currentTermY) onTargetChange?.(nextX, nextY)
  }

  const moveToPointer = (event: PointerEvent<SVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const valueX = (event.clientX - rect.left - geometry.left) / geometry.plot
    const valueY = 1 - (event.clientY - rect.top - geometry.top) / geometry.plot
    moveTarget(toTerm(valueX), toTerm(valueY))
  }

  const handleTargetKey = (event: KeyboardEvent<SVGElement>) => {
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, 1],
      ArrowDown: [0, -1],
    }
    const move = moves[event.key]
    if (!move) return
    event.preventDefault()
    moveTarget(currentTermX + move[0], currentTermY + move[1])
  }

  const legendItems: LegendItem[] = [
    ...alternatives.map((alt) => ({
      key: alt.id,
      label: alt.name,
      muted: !alt.passesSecurity,
      swatch: <AltDot color={alt.passesSecurity ? (colorById.get(alt.id) ?? 'var(--primary)') : 'var(--muted-foreground)'} />,
    })),
  ]

  return (
    <div className="flex flex-col gap-4">
      <div ref={ref} className="relative w-full" style={{ height }}>
        {size.width > 0 && (
          <svg
            ref={svgRef}
            width={width}
            height={height}
            role="img"
            aria-label={`Простір цілей: ${goalNames[0]} та ${goalNames[1]}`}
            className="mx-auto block overflow-visible text-[11px]"
            onMouseLeave={() => setHovered(null)}
          >
            <defs>
              <pattern id={patternId} width={6} height={6} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1={0} y1={0} x2={0} y2={6} stroke="var(--muted-foreground)" strokeOpacity={0.22} strokeWidth={1.5} />
              </pattern>
            </defs>

            {LEVELS.map((level) => {
              const start = (level - 1) * 0.2
              return (
                <rect
                  key={level}
                  x={toX(start)}
                  y={toY(1)}
                  width={(1 - start) * plot}
                  height={(1 - start) * plot}
                  style={{ fill: zoneFill(level) }}
                />
              )
            })}

            {threshold > 0 && (
              <path
                d={`M ${toX(0)} ${toY(1)} H ${toX(threshold)} V ${toY(threshold)} H ${toX(1)} V ${toY(0)} H ${toX(0)} Z`}
                fill={`url(#${patternId})`}
              />
            )}

            {TICKS.map((tick) => (
              <g key={tick}>
                <line x1={toX(tick)} x2={toX(tick)} y1={toY(0)} y2={toY(1)} stroke="var(--foreground)" strokeOpacity={0.06} />
                <line x1={toX(0)} x2={toX(1)} y1={toY(tick)} y2={toY(tick)} stroke="var(--foreground)" strokeOpacity={0.06} />
                <text x={toX(tick)} y={toY(0) + 18} textAnchor="middle" fill="var(--muted-foreground)" className="num">
                  {formatNumber(tick, 1)}
                </text>
                <text x={toX(0) - 10} y={toY(tick) + 4} textAnchor="end" fill="var(--muted-foreground)" className="num">
                  {formatNumber(tick, 1)}
                </text>
              </g>
            ))}
            <rect x={toX(0)} y={toY(1)} width={plot} height={plot} fill="none" stroke="var(--border)" />

            {LEVELS.map((level) => (
              <text
                key={level}
                x={toX((level - 1) * 0.2 + 0.1)}
                y={toY(1) - 8}
                textAnchor="middle"
                fontSize={10}
                fontWeight={600}
                style={{ fill: `color-mix(in srgb, ${securityColorVar(level)} 70%, var(--foreground))` }}
              >
                B{level}
              </text>
            ))}

            {threshold > 0 && (
              <g>
                <path
                  d={`M ${toX(threshold)} ${toY(1)} V ${toY(threshold)} H ${toX(1)}`}
                  fill="none"
                  stroke="var(--foreground)"
                  strokeOpacity={0.55}
                  strokeWidth={1.25}
                  strokeDasharray="5 4"
                />
                <text x={toX(threshold) + 6} y={toY(threshold) - 6} fontSize={10} fill="var(--muted-foreground)">
                  поріг B{minSecurityLevel}
                </text>
              </g>
            )}

            <text x={toX(0.5)} y={height - 6} textAnchor="middle" fill="var(--foreground)" fontSize={12} fontWeight={500}>
              {truncate(goalNames[0] ?? 'G1', Math.floor(plot / 6.5))}
            </text>
            <text
              x={14}
              y={toY(0.5)}
              textAnchor="middle"
              fill="var(--foreground)"
              fontSize={12}
              fontWeight={500}
              transform={`rotate(-90 14 ${toY(0.5)})`}
            >
              {truncate(goalNames[1] ?? 'G2', Math.floor(plot / 6.5))}
            </text>

            {alternatives
              .filter((alt) => alt.passesSecurity)
              .map((alt) => {
                const active = hovered === alt.id
                return (
                  <line
                    key={`link-${alt.id}`}
                    x1={toX(tx)}
                    y1={toY(ty)}
                    x2={toX(alt.goalScores[0] ?? 0)}
                    y2={toY(alt.goalScores[1] ?? 0)}
                    stroke={colorById.get(alt.id)}
                    strokeOpacity={linkOpacity(active, hovered !== null)}
                    strokeWidth={active ? 1.75 : 1}
                    strokeDasharray={active ? undefined : '3 3'}
                  />
                )
              })}

            <g>
              <rect
                x={toX(tx) - 6}
                y={toY(ty) - 6}
                width={12}
                height={12}
                transform={`rotate(45 ${toX(tx)} ${toY(ty)})`}
                fill="var(--foreground)"
                stroke="var(--card)"
                strokeWidth={2}
              />
              {targetPlacement && (
                <text
                  x={targetPlacement.x}
                  y={targetPlacement.y}
                  textAnchor={targetPlacement.anchor}
                  fontWeight={600}
                  fill="var(--foreground)"
                  paintOrder="stroke"
                  stroke="var(--card)"
                  strokeWidth={3}
                  strokeLinejoin="round"
                  className="num"
                >
                  {targetLabel}
                </text>
              )}
            </g>

            {alternatives.map((alt) => {
              const x = toX(alt.goalScores[0] ?? 0)
              const y = toY(alt.goalScores[1] ?? 0)
              const rank = rankById.get(alt.id)
              const best = rank?.rank === 1
              const color = colorById.get(alt.id) ?? 'var(--primary)'
              const dim = hovered !== null && hovered !== alt.id
              const label = labelById.get(alt.id)
              return (
                <g key={alt.id} opacity={dim ? 0.35 : 1} className="transition-opacity">
                  {best && <circle cx={x} cy={y} r={11} fill={color} fillOpacity={0.18} />}
                  <circle
                    cx={x}
                    cy={y}
                    r={best ? 6.5 : 5.5}
                    fill={alt.passesSecurity ? color : 'var(--card)'}
                    stroke={alt.passesSecurity ? 'var(--card)' : 'var(--muted-foreground)'}
                    strokeWidth={alt.passesSecurity ? 2 : 1.5}
                  />
                  {label && (
                    <text
                      x={label.x}
                      y={label.y}
                      textAnchor={label.anchor}
                      fontWeight={best ? 600 : 500}
                      fill={alt.passesSecurity ? 'var(--foreground)' : 'var(--muted-foreground)'}
                      paintOrder="stroke"
                      stroke="var(--card)"
                      strokeWidth={3}
                      strokeLinejoin="round"
                    >
                      {alt.name}
                    </text>
                  )}
                  {interactive && (
                    <circle
                      cx={x}
                      cy={y}
                      r={14}
                      fill="transparent"
                      onMouseEnter={() => setHovered(alt.id)}
                      onFocus={() => setHovered(alt.id)}
                      onBlur={() => setHovered(null)}
                      tabIndex={0}
                      role="button"
                      aria-label={`${alt.name}: ${formatVector(alt.goalScores)}`}
                      className="cursor-pointer outline-none"
                    />
                  )}
                </g>
              )
            })}
            {draggable && dragging && (
              <g pointerEvents="none">
                {TERM_TICKS.map((termX) =>
                  TERM_TICKS.map((termY) => (
                    <circle
                      key={`${termX}-${termY}`}
                      cx={toX(termX / TERM_STEPS)}
                      cy={toY(termY / TERM_STEPS)}
                      r={2}
                      fill="var(--primary)"
                      fillOpacity={0.45}
                    />
                  )),
                )}
                <path
                  d={`M ${toX(0)} ${toY(ty)} H ${toX(tx)} V ${toY(0)}`}
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth={1.25}
                  strokeDasharray="4 3"
                />
                <text x={toX(0) + 4} y={toY(ty) - 5} fontSize={10} fontWeight={600} fill="var(--primary)" className="num">
                  t₂ = {formatNumber(ty, 1)}
                </text>
                <text x={toX(tx) + 5} y={toY(0) - 6} fontSize={10} fontWeight={600} fill="var(--primary)" className="num">
                  t₁ = {formatNumber(tx, 1)}
                </text>
              </g>
            )}

            {draggable && (
              <g>
                <circle
                  cx={toX(tx)}
                  cy={toY(ty)}
                  r={13}
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth={1.5}
                  strokeDasharray={dragging ? undefined : '3 3'}
                  strokeOpacity={dragging ? 0.9 : 0.6}
                  pointerEvents="none"
                />
                <circle
                  cx={toX(tx)}
                  cy={toY(ty)}
                  r={18}
                  fill="transparent"
                  tabIndex={0}
                  role="button"
                  aria-label={`Вектор задоволення T ${formatVector([tx, ty], 1)}. Перетягніть або змініть стрілками`}
                  className={cn('outline-none focus-visible:stroke-ring focus-visible:stroke-2', dragging ? 'cursor-grabbing' : 'cursor-grab')}
                  onPointerDown={(event) => {
                    event.currentTarget.setPointerCapture(event.pointerId)
                    setDragging(true)
                    setHovered(null)
                  }}
                  onPointerMove={(event) => {
                    if (dragging) moveToPointer(event)
                  }}
                  onPointerUp={() => setDragging(false)}
                  onPointerCancel={() => setDragging(false)}
                  onKeyDown={handleTargetKey}
                />
              </g>
            )}
          </svg>
        )}

        {interactive && hoveredAlt && (
          <ChartTooltip
            x={toX(hoveredAlt.goalScores[0] ?? 0)}
            y={toY(hoveredAlt.goalScores[1] ?? 0)}
            containerWidth={size.width}
          >
            <PointTooltip
              alternative={hoveredAlt}
              color={colorById.get(hoveredAlt.id) ?? 'var(--primary)'}
              rank={rankById.get(hoveredAlt.id) ?? null}
              goalNames={goalNames}
            />
          </ChartTooltip>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
        <ChartLegend items={legendItems} activeKey={hovered} onHover={interactive ? setHovered : undefined} />
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          <li className="flex items-center gap-1.5">
            <span aria-hidden className="size-2.5 rotate-45 bg-foreground" />
            Вектор задоволення T
          </li>
          <li className="flex items-center gap-1.5">
            <span aria-hidden className="size-2.5 rounded-full border-[1.5px] border-muted-foreground" />
            Відсіяна
          </li>
          {threshold > 0 && (
            <li className="flex items-center gap-1.5">
              <span aria-hidden className="w-4 border-t-[1.5px] border-dashed border-foreground/60" />
              Поріг безпеки
            </li>
          )}
          {draggable && <li className="text-primary">Перетягніть T, щоб змінити потреби</li>}
        </ul>
      </div>
    </div>
  )
}

type PointTooltipProps = {
  alternative: AlternativeResult
  color: string
  rank: DisplayRank | null
  goalNames: string[]
}

export function PointTooltip(props: PointTooltipProps) {
  const { alternative, color, rank, goalNames } = props
  const satisfaction = alternative.satisfaction
  const level = SECURITY_LEVELS[alternative.securityLevel - 1]
  return (
    <div className="flex flex-col">
      <div className="mb-1.5 flex items-center gap-2 border-b pb-1.5">
        <AltDot color={color} muted={!alternative.passesSecurity} />
        <span className="truncate text-[13px] font-semibold">{alternative.name}</span>
        <span className="ml-auto text-muted-foreground num">{rank ? `ранг ${formatRank(rank)}` : 'відсіяно'}</span>
      </div>
      {goalNames.map((name, index) => (
        <TooltipRow key={name} label={`G${index + 1}`} value={formatFixed(alternative.goalScores[index] ?? 0)} />
      ))}
      <TooltipRow label="Безпека" value={`B${alternative.securityLevel} · ${level.label.toLowerCase()}`} />
      {satisfaction && (
        <>
          <div className="my-1 h-px bg-border" />
          <TooltipRow label="n (відхилення)" value={formatVector(satisfaction.distance)} />
          <TooltipRow label="μ = min(m, n)" value={formatVector(satisfaction.closeness)} />
          <TooltipRow label="Z = 1 − μ" value={formatVector(satisfaction.z)} />
          <TooltipRow label="Z*" value={formatFixed(satisfaction.zStar)} />
        </>
      )}
    </div>
  )
}
