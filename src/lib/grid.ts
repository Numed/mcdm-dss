import type * as React from 'react'

export type GridPosition = {
  row: number
  col: number
}

type GridKeyHandler = (event: React.KeyboardEvent<HTMLElement>) => void

export function formatCellValue(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) return ''
  return String(value).replace('.', ',')
}

function readCell(element: Element | null): HTMLInputElement | null {
  return element instanceof HTMLInputElement ? element : null
}

function focusCell(container: HTMLElement, row: number, col: number): boolean {
  const target = readCell(container.querySelector(`[data-grid-row="${row}"][data-grid-col="${col}"]`))
  if (!target) return false
  target.focus()
  target.select()
  return true
}

export function useGridKeys(): GridKeyHandler {
  return (event) => {
    const input = readCell(event.target instanceof Element ? event.target : null)
    if (!input || input.dataset.gridRow === undefined) return
    const container = event.currentTarget
    const row = Number(input.dataset.gridRow)
    const col = Number(input.dataset.gridCol)
    const atStart = input.selectionStart === 0 && input.selectionEnd === 0
    const atEnd = input.selectionStart === input.value.length && input.selectionEnd === input.value.length
    const allSelected = input.selectionStart === 0 && input.selectionEnd === input.value.length
    let moved = false
    if (event.key === 'ArrowDown' || (event.key === 'Enter' && !event.shiftKey)) moved = focusCell(container, row + 1, col)
    else if (event.key === 'ArrowUp' || (event.key === 'Enter' && event.shiftKey)) moved = focusCell(container, row - 1, col)
    else if (event.key === 'ArrowLeft' && (atStart || allSelected)) moved = focusCell(container, row, col - 1)
    else if (event.key === 'ArrowRight' && (atEnd || allSelected)) moved = focusCell(container, row, col + 1)
    if (moved || event.key === 'Enter') event.preventDefault()
  }
}

export function readGridPosition(target: EventTarget): GridPosition | null {
  const input = readCell(target instanceof Element ? target : null)
  if (!input || input.dataset.gridRow === undefined) return null
  return { row: Number(input.dataset.gridRow), col: Number(input.dataset.gridCol) }
}
