export function parseLocaleNumber(raw: string): number | null {
  const cleaned = raw
    .trim()
    .replace(/[\s  ]/g, '')
    .replace(/%$/, '')
    .replace(',', '.')
  if (cleaned === '' || !/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(cleaned)) return null
  const value = Number(cleaned)
  return Number.isFinite(value) ? value : null
}

export function parseClipboardGrid(text: string): string[][] {
  const normalized = text.replace(/\r\n?/g, '\n').replace(/\n+$/, '')
  if (normalized === '') return []
  return normalized.split('\n').map((line) => line.split('\t'))
}
