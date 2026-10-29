const DARK_INK = '#111111'
const LIGHT_INK = '#ffffff'
const MIN_CONTRAST = 4.5

export type InkPair = {
  fill: string
  ink: string
}

function parseHex(hex: string): [number, number, number] | null {
  const match = /^#?([\da-f]{6})$/i.exec(hex.trim())
  if (!match) return null
  const value = Number.parseInt(match[1], 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

function channel(value: number): number {
  const normalized = value / 255
  return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4
}

export function relativeLuminance(hex: string): number | null {
  const rgb = parseHex(hex)
  if (!rgb) return null
  const [r, g, b] = rgb.map(channel)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrastRatio(first: string, second: string): number {
  const a = relativeLuminance(first) ?? 0
  const b = relativeLuminance(second) ?? 0
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

export function readableInk(background: string): string {
  if (relativeLuminance(background) === null) return LIGHT_INK
  return contrastRatio(background, LIGHT_INK) >= contrastRatio(background, DARK_INK) ? LIGHT_INK : DARK_INK
}

function toHex(rgb: [number, number, number]): string {
  return `#${rgb.map((value) => Math.round(value).toString(16).padStart(2, '0')).join('')}`
}

function darken(hex: string, amount: number): string {
  const rgb = parseHex(hex)
  if (!rgb) return hex
  return toHex([rgb[0] * (1 - amount), rgb[1] * (1 - amount), rgb[2] * (1 - amount)])
}

export function readablePair(background: string): InkPair {
  const ink = readableInk(background)
  if (relativeLuminance(background) === null || contrastRatio(background, ink) >= MIN_CONTRAST) {
    return { fill: background, ink }
  }
  for (let step = 1; step <= 10; step++) {
    const fill = darken(background, step * 0.03)
    if (contrastRatio(fill, LIGHT_INK) >= MIN_CONTRAST) return { fill, ink: LIGHT_INK }
  }
  return { fill: darken(background, 0.3), ink: LIGHT_INK }
}

export function resolveCssColor(value: string): string {
  const match = /^var\((--[\w-]+)\)$/.exec(value.trim())
  if (!match || typeof document === 'undefined') return value
  return getComputedStyle(document.documentElement).getPropertyValue(match[1]).trim() || value
}
