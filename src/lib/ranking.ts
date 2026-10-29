const TIE_EPSILON = 1e-9

export type DisplayRank = {
  rank: number
  tied: boolean
}

export function competitionRanks(scores: number[], higherIsBetter = true): DisplayRank[] {
  const order = scores
    .map((score, index) => ({ score: higherIsBetter ? score : -score, index }))
    .sort((a, b) => b.score - a.score)
  const result = new Array<DisplayRank>(scores.length)
  order.forEach((entry, position) => {
    const previous = order[position - 1]
    const sameAsPrevious = previous !== undefined && Math.abs(previous.score - entry.score) < TIE_EPSILON
    const rank = sameAsPrevious ? result[previous.index].rank : position + 1
    result[entry.index] = { rank, tied: false }
  })
  const counts = new Map<number, number>()
  result.forEach((item) => counts.set(item.rank, (counts.get(item.rank) ?? 0) + 1))
  return result.map((item) => ({ rank: item.rank, tied: (counts.get(item.rank) ?? 0) > 1 }))
}

export function formatRank(rank: DisplayRank): string {
  return rank.tied ? `${rank.rank}=` : String(rank.rank)
}
