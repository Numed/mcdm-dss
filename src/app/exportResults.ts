import { toast } from 'sonner'
import { downloadText, fileSlug } from '@/lib/download'
import { useProjectStore } from '@/store/projectStore'
import { type DataTable, cellText, comparisonTable, rankingTable, summaryTable } from './resultTables'
import { analyzeCached } from './useAnalysis'

function currentTables(): DataTable[] {
  const project = useProjectStore.getState().project
  const analysis = analyzeCached(project)
  const tables = [rankingTable(project, analysis), summaryTable(project, analysis)]
  const comparison = comparisonTable(project, analysis)
  if (comparison) tables.push(comparison)
  return tables
}

function csvEscape(value: string): string {
  if (/[";\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

export function exportResultsCsv(): void {
  const project = useProjectStore.getState().project
  const table = currentTables()[0]
  const lines = [table.headers, ...table.rows.map((row) => row.map(cellText))].map((row) => row.map(csvEscape).join(';'))
  const name = `${fileSlug(project.title)}-results.csv`
  downloadText(name, `﻿${lines.join('\r\n')}`, 'text/csv;charset=utf-8')
  toast.success('Результати експортовано в CSV', { description: name })
}

export async function exportResultsXlsx(): Promise<void> {
  const project = useProjectStore.getState().project
  const XLSX = await import('xlsx')
  const workbook = XLSX.utils.book_new()
  const sheetNames = ['Ранжування', 'Параметри', 'Порівняння']
  currentTables().forEach((table, index) => {
    const rows = table.rows.map((row) => row.map((cell) => (typeof cell === 'number' ? Math.round(cell * 1000) / 1000 : cell)))
    const sheet = XLSX.utils.aoa_to_sheet([table.headers, ...rows])
    sheet['!cols'] = table.headers.map((header) => ({ wch: Math.max(10, Math.min(header.length + 2, 40)) }))
    XLSX.utils.book_append_sheet(workbook, sheet, sheetNames[index] ?? `Аркуш ${index + 1}`)
  })
  const name = `${fileSlug(project.title)}-results.xlsx`
  XLSX.writeFile(workbook, name)
  toast.success('Результати експортовано в Excel', { description: name })
}

export async function copyTableForWord(table: DataTable): Promise<void> {
  const htmlRows = [
    `<tr>${table.headers.map((header) => `<th style="border:1px solid #000;padding:2pt 4pt;font-weight:bold">${escapeHtml(header)}</th>`).join('')}</tr>`,
    ...table.rows.map(
      (row) =>
        `<tr>${row
          .map((cell) => {
            const align = typeof cell === 'number' ? 'right' : 'left'
            return `<td style="border:1px solid #000;padding:2pt 4pt;text-align:${align}">${escapeHtml(cellText(cell))}</td>`
          })
          .join('')}</tr>`,
    ),
  ]
  const html = `<table style="border-collapse:collapse;font-family:'Times New Roman';font-size:12pt">${htmlRows.join('')}</table>`
  const plain = [table.headers, ...table.rows.map((row) => row.map(cellText))].map((row) => row.join('\t')).join('\n')
  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([plain], { type: 'text/plain' }),
      }),
    ])
    toast.success('Таблицю скопійовано', { description: 'Вставте її у Word або Google Docs' })
  } catch {
    try {
      await navigator.clipboard.writeText(plain)
      toast.success('Таблицю скопійовано як текст')
    } catch {
      toast.error('Браузер не дозволив доступ до буфера обміну')
    }
  }
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
