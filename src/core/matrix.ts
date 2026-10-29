export type Vector = number[]
export type Matrix = number[][]

export function transpose(matrix: Matrix): Matrix {
  if (matrix.length === 0) return []
  return matrix[0].map((_, col) => matrix.map((row) => row[col]))
}

export function multiply(left: Matrix, right: Matrix): Matrix {
  const inner = right.length
  const cols = inner === 0 ? 0 : right[0].length
  return left.map((row) => {
    const result = new Array<number>(cols).fill(0)
    for (let k = 0; k < inner; k++) {
      const value = row[k]
      if (value === 0) continue
      const rightRow = right[k]
      for (let j = 0; j < cols; j++) result[j] += value * rightRow[j]
    }
    return result
  })
}

export function sum(values: Vector): number {
  return values.reduce((acc, value) => acc + value, 0)
}

export function normalizeBySum(values: Vector): Vector {
  const total = sum(values)
  if (total === 0) return values.map(() => 1 / Math.max(values.length, 1))
  return values.map((value) => value / total)
}

export function normalizeByMax(values: Vector): Vector {
  const max = Math.max(...values, 0)
  if (max === 0) return values.map(() => 0)
  return values.map((value) => value / max)
}

export function euclideanNorm(values: Vector): number {
  return Math.sqrt(values.reduce((acc, value) => acc + value * value, 0))
}
