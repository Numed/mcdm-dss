import { describe, expect, it } from 'vitest'
import { contrastRatio, readableInk, readablePair } from './contrast'

const PALETTE = [
  '#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948',
  '#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#22a022', '#9085e9', '#e66767',
]

describe('readableInk', () => {
  it('uses dark ink on yellow and white ink on blue', () => {
    expect(readableInk('#eda100')).toBe('#111111')
    expect(readableInk('#2a78d6')).toBe('#ffffff')
  })

  it('keeps rank numbers at least 4.5:1 on every alternative color', () => {
    PALETTE.forEach((color) => {
      const pair = readablePair(color)
      expect(contrastRatio(pair.fill, pair.ink)).toBeGreaterThanOrEqual(4.5)
    })
  })

  it('leaves colors that already pass untouched', () => {
    expect(readablePair('#eda100')).toEqual({ fill: '#eda100', ink: '#111111' })
  })
})
