import { z } from 'zod'
import { router, publicProcedure } from '../trpc'
import { db } from '@/lib/db'
import { lottoWinResult, lottoPrizeStats, lottoWinningStores } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'

function computeDrawStats(numbers: number[]) {
  const odd = numbers.filter((n) => n % 2 === 1).length
  const even = numbers.length - odd
  const high = numbers.filter((n) => n >= 23).length
  const low = numbers.length - high
  const total_sum = numbers.reduce((a, b) => a + b, 0)
  return {
    odd_even: { odd, even },
    high_low: { high, low },
    total_sum,
  }
}

export const adminRouter = router({
  createDraw: publicProcedure
    .input(
      z.object({
        round: z.number().int().min(1), // 회차 번호 = id
        draw_date: z.coerce.date(),
        numbers: z.array(z.number().min(1).max(45)).length(6),
        bonus: z.number().min(1).max(45),
        prize_amount: z.number().min(0).optional().nullable(),
        winner_count: z.number().int().min(0).optional().nullable(),
      })
    )
    .mutation(async ({ input }) => {
      const { odd_even, high_low, total_sum } = computeDrawStats(input.numbers)
      const payload = {
        id: input.round,
        draw_date: input.draw_date,
        numbers: input.numbers,
        bonus: input.bonus,
        prize_amount: input.prize_amount ?? null,
        winner_count: input.winner_count ?? null,
        odd_even,
        high_low,
        total_sum,
      }
      const [row] = await db
        .insert(lottoWinResult)
        .values(payload)
        .onConflictDoUpdate({
          target: lottoWinResult.id,
          set: {
            draw_date: payload.draw_date,
            numbers: payload.numbers,
            bonus: payload.bonus,
            prize_amount: payload.prize_amount,
            winner_count: payload.winner_count,
            odd_even: payload.odd_even,
            high_low: payload.high_low,
            total_sum: payload.total_sum,
          },
        })
        .returning()
      return row
    }),

  addPrizeStats: publicProcedure
    .input(
      z.object({
        draw_id: z.number(),
        rows: z.array(
          z.object({
            rank: z.number().int().min(1).max(5),
            prize_per_person: z.number().int().min(0),
            winner_count: z.number().int().min(0),
            total_prize: z.number().int().min(0).optional(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const inserted = await db
        .insert(lottoPrizeStats)
        .values(
          input.rows.map((r) => ({
            draw_id: input.draw_id,
            rank: r.rank,
            prize_per_person: r.prize_per_person,
            winner_count: r.winner_count,
            total_prize: r.total_prize ?? r.prize_per_person * r.winner_count,
          }))
        )
        .returning()
      return inserted
    }),

  addWinningStore: publicProcedure
    .input(
      z.object({
        draw_id: z.number(),
        rank: z.number().int().min(1).max(5).optional().default(1),
        store_name: z.string().min(1),
        location: z.string().optional().nullable(),
        method: z.enum(['수동', '자동', '반자동']).optional().nullable(),
      })
    )
    .mutation(async ({ input }) => {
      const [row] = await db
        .insert(lottoWinningStores)
        .values({
          draw_id: input.draw_id,
          rank: input.rank,
          store_name: input.store_name,
          location: input.location ?? null,
          method: input.method ?? null,
        })
        .returning()
      return row
    }),

  listRecentDraws: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(100).optional().default(20) }))
    .query(async ({ input }) => {
      return await db
        .select()
        .from(lottoWinResult)
        .orderBy(desc(lottoWinResult.draw_date))
        .limit(input.limit)
    }),
})
