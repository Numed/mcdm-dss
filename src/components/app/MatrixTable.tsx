import type { Matrix } from '@/core/matrix'
import { cn, formatFixed } from '@/lib/utils'

type MatrixTableProps = {
  label: string
  caption?: string
  matrix: Matrix
  rowLabels: string[]
  columnLabels: string[]
  rowTitles?: string[]
  columnTitles?: string[]
  highlightRowMax?: boolean
  className?: string
}

export function MatrixTable(props: MatrixTableProps) {
  const { label, caption, matrix, rowLabels, columnLabels, rowTitles, columnTitles, highlightRowMax, className } = props
  return (
    <figure className={cn('flex min-w-0 flex-col gap-2', className)}>
      <figcaption className="flex items-baseline gap-2">
        <span className="font-semibold">{label}</span>
        {caption && <span className="text-xs text-muted-foreground">{caption}</span>}
      </figcaption>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-muted/50">
              <th className="sticky left-0 z-10 bg-muted px-2.5 py-1.5" />
              {columnLabels.map((column, index) => (
                <th
                  key={`${column}-${index}`}
                  title={columnTitles?.[index]}
                  className="px-2.5 py-1.5 text-right font-medium whitespace-nowrap text-muted-foreground"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, rowIndex) => {
              const max = Math.max(...row)
              return (
                <tr key={rowIndex} className="border-t">
                  <th
                    scope="row"
                    title={rowTitles?.[rowIndex]}
                    className="sticky left-0 z-10 bg-card px-2.5 py-1.5 text-left font-medium whitespace-nowrap text-muted-foreground"
                  >
                    {rowLabels[rowIndex]}
                  </th>
                  {row.map((value, columnIndex) => (
                    <td
                      key={columnIndex}
                      className={cn(
                        'px-2.5 py-1.5 text-right whitespace-nowrap num',
                        highlightRowMax && value === max && 'font-semibold text-primary',
                      )}
                    >
                      {formatFixed(value)}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </figure>
  )
}
