/**
 * prizes + numbers 조인 결과 → 기존 API/UI 형식
 */
import type { prizes, numbers } from './schema'

type PrizesRow = typeof prizes.$inferSelect
type NumbersRow = typeof numbers.$inferSelect

export type JoinedDrawRow = PrizesRow & NumbersRow

/** 조인 쿼리에서 선택한 필드만 있어도 map 가능 */
export type DrawRowForMap = {
  round: number
  draw_date: string
  numbers: number[] | null
  bonus: number
  prize_1st: number | null
  count_1st: number | null
  total_round_sales: number | null
}

export function parseDrawDate(ymd: string): Date {
  const y = ymd.slice(0, 4)
  const m = ymd.slice(4, 6)
  const d = ymd.slice(6, 8)
  return new Date(`${y}-${m}-${d}`)
}

export function formatDateToYmd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}${m}${day}`
}

export const parseLtRflYmd = parseDrawDate

export function mapLottoRow(row: JoinedDrawRow | DrawRowForMap): {
  id: number
  draw_date: Date
  numbers: number[]
  bonus: number
  prize_amount: number | null
  winner_count: number | null
  round_sales_amount: number | null
} {
  return {
    id: row.round,
    draw_date: parseDrawDate(row.draw_date),
    numbers: Array.isArray(row.numbers) ? row.numbers : [],
    bonus: row.bonus,
    prize_amount: row.prize_1st ?? null,
    winner_count: row.count_1st ?? null,
    round_sales_amount: row.total_round_sales ?? null,
  }
}
