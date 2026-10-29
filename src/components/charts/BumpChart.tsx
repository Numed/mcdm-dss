import { useState } from 'react'
import { useElementSize } from '@/app/useElementSize'
import { cn } from '@/lib/utils'

export type BumpColumn = {
  key: string
  label: string
  sublabel?: string
}

export type BumpSeries = {
  id: string
  label: string
  color: string
  ranks: (number | null)[]
}

type BumpChartProps = {
  columns: BumpColumn[]
  series: BumpSeries[]
  highlightColumn?: number
  ariaLabel: string
}

type Node = {
  x: number
  y: number
  rank: number
}

const ROW = 40
const TOP = 52
const BOTTOM = 16
const SIDE = 128
const TIE_SPREAD = 9

function nodePath(nodes: (Node | null)[]): string {
  let path = ''
  let previous: Node | null = null
  for (const node of nodes) {
    if (!node) {
      previous = null
      continue
    }
    if (!previous) path += `M ${node.x} ${node.y} `
    else {
      const middle = (previous.x + node.x) / 2
      path += `C ${middle} ${previous.y}, ${middle} ${node.y}, ${node.x} ${node.y} `
    }
    previous = node
  }
  return path.trim()
}

function seriesOpacity(active: boolean, anyHovered: boolean): number {
  if (active || !anyHovered) return 1
  return 0.18
}

export function BumpChart(props: BumpChartProps) {
  const { columns, series, highlightColumn, ariaLabel } = props
  const { ref, size } = useElementSize<HTMLDivElement>()
  const [hovered, setHovered] = useState<string | null>(null)
  const maxRank = Math.max(series.length, ...series.flatMap((item) => item.ranks.map((rank) => rank ?? 0)), 1)
  const height = TOP + BOTTOM + (maxRank - 1) * ROW + 24
  const plotLeft = SIDE
  const plotRight = Math.max(size.width - SIDE, plotLeft + 40)
  const step = columns.length > 1 ? (plotRight - plotLeft) / (columns.length - 1) : 0
  const columnX = (index: number) => plotLeft + index * step
  const rankY = (rank: number) => TOP + 12 + (rank - 1) * ROW

  const nodesBySeries = new Map<string, (Node | null)[]>()
  columns.forEach((_, columnIndex) => {
    const groups = new Map<number, BumpSeries[]>()
    series.forEach((item) => {
      const rank = item.ranks[columnIndex]
      if (rank === null || rank === undefined) return
      groups.set(rank, [...(groups.get(rank) ?? []), item])
    })
    series.forEach((item) => {
      const nodes = nodesBySeries.get(item.id) ?? []
      const rank = item.ranks[columnIndex]
      if (rank === null || rank === undefined) {
        nodes[columnIndex] = null
      } else {
        const group = groups.get(rank) ?? [item]
        const position = group.indexOf(item)
        const offset = (position - (group.length - 1) / 2) * TIE_SPREAD
        nodes[columnIndex] = { x: columnX(columnIndex), y: rankY(rank) + offset, rank }
      }
      nodesBySeries.set(item.id, nodes)
    })
  })

  const firstColumn = 0
  const lastColumn = columns.length - 1

  return (
    <div ref={ref} className="w-full" style={{ height }}>
      {size.width > 0 && (
        <svg width={size.width} height={height} role="img" aria-label={ariaLabel} className="block text-[11px]">
          {highlightColumn !== undefined && (
            <rect
              x={columnX(highlightColumn) - 26}
              y={8}
              width={52}
              height={height - 12}
              rx={8}
              fill="var(--primary)"
              fillOpacity={0.06}
            />
          )}
          {columns.map((column, index) => (
            <g key={column.key}>
              <line
                x1={columnX(index)}
                x2={columnX(index)}
                y1={TOP - 4}
                y2={height - BOTTOM}
                stroke="var(--foreground)"
                strokeOpacity={0.07}
              />
              <text
                x={columnX(index)}
                y={20}
                textAnchor="middle"
                fontWeight={600}
                fontSize={12}
                fill={index === highlightColumn ? 'var(--primary)' : 'var(--foreground)'}
              >
                {column.label}
              </text>
              {column.sublabel && (
                <text x={columnX(index)} y={35} textAnchor="middle" fill="var(--muted-foreground)">
                  {column.sublabel}
                </text>
              )}
            </g>
          ))}

          {series.map((item) => {
            const nodes = nodesBySeries.get(item.id) ?? []
            const active = hovered === item.id
            return (
              <g
                key={item.id}
                opacity={seriesOpacity(active, hovered !== null)}
                className="cursor-pointer transition-opacity"
                onMouseEnter={() => setHovered(item.id)}
                onMouseLeave={() => setHovered(null)}
              >
                <path d={nodePath(nodes)} fill="none" stroke="var(--card)" strokeWidth={active ? 7 : 6} strokeLinecap="round" />
                <path d={nodePath(nodes)} fill="none" stroke={item.color} strokeWidth={active ? 3 : 2.25} strokeLinecap="round" />
                {nodes.map((node, columnIndex) => {
                  if (!node) return null
                  return (
                    <g key={columnIndex}>
                      <circle cx={node.x} cy={node.y} r={10} fill={item.color} stroke="var(--card)" strokeWidth={2} />
                      <text x={node.x} y={node.y + 3.5} textAnchor="middle" fontSize={10} fontWeight={700} fill="#fff" className="num">
                        {node.rank}
                      </text>
                    </g>
                  )
                })}
                {nodes[firstColumn] && (
                  <text
                    x={columnX(firstColumn) - 18}
                    y={(nodes[firstColumn]?.y ?? 0) + 4}
                    textAnchor="end"
                    fontWeight={active ? 600 : 500}
                    fill="var(--foreground)"
                  >
                    {item.label}
                  </text>
                )}
                {nodes[lastColumn] && lastColumn > firstColumn && (
                  <text
                    x={columnX(lastColumn) + 18}
                    y={(nodes[lastColumn]?.y ?? 0) + 4}
                    fontWeight={active ? 600 : 500}
                    fill="var(--foreground)"
                  >
                    {item.label}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      )}
      <span className={cn('sr-only')}>
        {series.map((item) => `${item.label}: ${item.ranks.map((rank) => rank ?? '—').join(', ')}`).join('; ')}
      </span>
    </div>
  )
}
