import { describe, expect, it } from 'vitest'
import { parseClipboardGrid, parseLocaleNumber } from './parse'

describe('parseLocaleNumber', () => {
  it('accepts decimal comma, spaces and percent', () => {
    expect(parseLocaleNumber('1 234,5')).toBe(1234.5)
    expect(parseLocaleNumber('17,5%')).toBe(17.5)
    expect(parseLocaleNumber('-0.2')).toBe(-0.2)
  })

  it('rejects text', () => {
    expect(parseLocaleNumber('Банк А')).toBeNull()
    expect(parseLocaleNumber('')).toBeNull()
  })
})

describe('parseClipboardGrid', () => {
  it('splits Excel TSV into rows and cells', () => {
    expect(parseClipboardGrid('1\t2\r\n3\t4\r\n')).toEqual([
      ['1', '2'],
      ['3', '4'],
    ])
  })
})
