import { z } from 'zod'
import { router, publicProcedure } from '../trpc'
import { db } from '@/lib/db'
import { prizes, numbers } from '@/lib/db/schema'
import { mapLottoRow, formatDateToYmd } from '@/lib/db/mapLottoRow'
import { computeAll } from '@/lib/db/computeNumbers'
import { eq, desc, asc, gte, lte, and, sql } from 'drizzle-orm'

// prizes + numbers 조인 쿼리 (공통)
const joinedDraw = db
  .select({
    round: prizes.round,
    draw_date: prizes.draw_date,
    numbers: numbers.numbers,
    bonus: numbers.bonus,
    prize_1st: prizes.prize_1st,
    count_1st: prizes.count_1st,
    total_round_sales: prizes.total_round_sales,
    prize_2nd: prizes.prize_2nd,
    prize_3rd: prizes.prize_3rd,
    prize_4th: prizes.prize_4th,
    prize_5st: prizes.prize_5st,
  })
  .from(numbers)
  .innerJoin(prizes, eq(numbers.round, prizes.round))

export const lottoRouter = router({
  getAll: publicProcedure.query(async () => {
    const rows = await joinedDraw.orderBy(desc(prizes.draw_date))
    return rows.map(mapLottoRow)
  }),

  getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const result = await joinedDraw.where(eq(prizes.round, input.id)).limit(1)
    const row = result[0]
    return row ? mapLottoRow(row) : null
  }),

  search: publicProcedure
    .input(
      z.object({
        numbers: z.array(z.number().min(1).max(45)).optional(),
        period: z.enum(['all', '1year', '6months', '3months', '1month', 'custom']).optional().default('all'),
        customStartDate: z.date().optional(),
        customEndDate: z.date().optional(),
        prizeAmount: z.enum(['30억이상', '20억대', '10억대', 'custom']).optional(),
        customPrizeMin: z.number().optional(),
        customPrizeMax: z.number().optional(),
        winnerCount: z.enum(['10명이하', '10명대', '20명대', '30명대']).optional(),
        sortBy: z.enum(['date-desc', 'date-asc', 'prize-desc', 'prize-asc', 'winner-desc', 'winner-asc']).optional().default('date-desc'),
        limit: z.number().min(1).max(1000).optional().default(100),
        offset: z.number().min(0).optional().default(0),
      })
    )
    .query(async ({ input }) => {
      const conditions = []

      if (input.period !== 'all') {
        const now = new Date()
        let startDate: Date
        switch (input.period) {
          case '1year': startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()); break
          case '6months': startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()); break
          case '3months': startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()); break
          case '1month': startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()); break
          case 'custom': startDate = input.customStartDate ? input.customStartDate : new Date(0); break
          default: startDate = new Date(0)
        }
        const startYmd = formatDateToYmd(startDate)
        conditions.push(gte(prizes.draw_date, startYmd))
        if (input.period === 'custom' && input.customEndDate) {
          conditions.push(lte(prizes.draw_date, formatDateToYmd(input.customEndDate)))
        } else if (input.period !== 'custom') {
          conditions.push(lte(prizes.draw_date, formatDateToYmd(now)))
        }
      }

      if (input.numbers && input.numbers.length > 0) {
        const perNum = input.numbers.map((num) =>
          sql`((${numbers.numbers}::jsonb @> ${sql.raw(JSON.stringify([num]))}::jsonb) OR (${numbers.bonus} = ${num}))`
        )
        conditions.push(and(...perNum) as any)
      }

      if (input.prizeAmount) {
        switch (input.prizeAmount) {
          case '30억이상': conditions.push(gte(prizes.prize_1st, 3000000000)); break
          case '20억대': conditions.push(and(gte(prizes.prize_1st, 2000000000), lte(prizes.prize_1st, 2999999999)) as any); break
          case '10억대': conditions.push(and(gte(prizes.prize_1st, 1000000000), lte(prizes.prize_1st, 1999999999)) as any); break
          case 'custom':
            if (input.customPrizeMin) conditions.push(gte(prizes.prize_1st, input.customPrizeMin))
            if (input.customPrizeMax) conditions.push(lte(prizes.prize_1st, input.customPrizeMax))
            break
        }
      }

      if (input.winnerCount) {
        switch (input.winnerCount) {
          case '10명이하': conditions.push(lte(prizes.count_1st, 10)); break
          case '10명대': conditions.push(and(gte(prizes.count_1st, 10), lte(prizes.count_1st, 19)) as any); break
          case '20명대': conditions.push(and(gte(prizes.count_1st, 20), lte(prizes.count_1st, 29)) as any); break
          case '30명대': conditions.push(and(gte(prizes.count_1st, 30), lte(prizes.count_1st, 39)) as any); break
        }
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined

      let orderBy
      switch (input.sortBy) {
        case 'date-asc': orderBy = asc(prizes.draw_date); break
        case 'prize-desc': orderBy = desc(prizes.prize_1st); break
        case 'prize-asc': orderBy = asc(prizes.prize_1st); break
        case 'winner-desc': orderBy = desc(prizes.count_1st); break
        case 'winner-asc': orderBy = asc(prizes.count_1st); break
        default: orderBy = desc(prizes.draw_date)
      }

      const rows = await joinedDraw
        .where(whereClause)
        .orderBy(orderBy)
        .limit(input.limit)
        .offset(input.offset)

      const countResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(numbers)
        .innerJoin(prizes, eq(numbers.round, prizes.round))
        .where(whereClause)

      return {
        results: rows.map(mapLottoRow),
        total: Number(countResult[0]?.count || 0),
      }
    }),

  create: publicProcedure
    .input(
      z.object({
        draw_date: z.date(),
        numbers: z.array(z.number().min(1).max(45)).length(6),
        bonus: z.number().min(1).max(45),
        round: z.number().int().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const computed = computeAll(input.numbers)
      await db.insert(prizes).values({
        round: input.round,
        draw_date: formatDateToYmd(input.draw_date),
        count_auto: 0,
        count_manual: 0,
        count_semi: 0,
        count_1st: 0,
        prize_1st: null,
        sum_prize_1st: null,
        count_2nd: 0,
        prize_2nd: null,
        sum_prize_2nd: null,
        count_3rd: 0,
        prize_3rd: null,
        sum_prize_3rd: null,
        count_4th: 0,
        prize_4th: null,
        sum_prize_4th: null,
        count_5st: 0,
        prize_5st: null,
        sum_prize_5st: null,
        total_winner_count: null,
        total_round_sales: null,
      }).onConflictDoUpdate({ target: prizes.round, set: { draw_date: formatDateToYmd(input.draw_date) } })

      await db.insert(numbers).values({
        round: input.round,
        numbers: input.numbers,
        bonus: input.bonus,
        odd_even: computed.odd_even,
        high_low: computed.high_low,
        sum: computed.sum,
        sections: computed.sections,
        end_sum: computed.end_sum,
      }).onConflictDoUpdate({
        target: numbers.round,
        set: { numbers: input.numbers, bonus: input.bonus, odd_even: computed.odd_even, high_low: computed.high_low, sum: computed.sum, sections: computed.sections, end_sum: computed.end_sum },
      })

      const [row] = await joinedDraw.where(eq(prizes.round, input.round)).limit(1)
      return row ? mapLottoRow(row) : null
    }),

  simulateTenYears: publicProcedure
    .input(
      z.object({
        numbers: z.array(z.number().min(1).max(45)).length(6),
        bonus: z.number().min(1).max(45).optional(),
      })
    )
    .query(async ({ input }) => {
      const tenYearsAgo = new Date()
      tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10)
      const ymdStart = formatDateToYmd(tenYearsAgo)
      const draws = await joinedDraw
        .where(gte(prizes.draw_date, ymdStart))
        .orderBy(asc(prizes.draw_date))
      if (draws.length === 0) {
        return { drawCount: 0, totalSpent: 0, totalWon: 0, profit: 0, wins: [] as { round: number; rank: number; prize: number; date: string; numbers: number[]; bonus?: number }[] }
      }
      const userNums = new Set(input.numbers)
      const bonus = input.bonus ?? 0
      const wins: { round: number; rank: number; prize: number; date: string; numbers: number[]; bonus?: number }[] = []
      let totalWon = 0
      for (const d of draws) {
        const nums = Array.isArray(d.numbers) ? d.numbers : []
        const match = nums.filter((n) => userNums.has(n)).length
        const hasBonus = bonus && bonus === d.bonus
        let rank = 0
        if (match === 6) rank = 1
        else if (match === 5 && hasBonus) rank = 2
        else if (match === 5) rank = 3
        else if (match === 4) rank = 4
        else if (match === 3) rank = 5
        if (rank === 0) continue
        let prize = 0
        if (rank === 1) prize = d.prize_1st ?? 0
        else if (rank === 2) prize = d.prize_2nd ?? 0
        else if (rank === 3) prize = d.prize_3rd ?? 0
        else if (rank === 4) prize = d.prize_4th ?? 0
        else if (rank === 5) prize = d.prize_5st ?? 0
        totalWon += prize
        wins.push({
          round: d.round,
          rank,
          prize,
          date: d.draw_date ? `${d.draw_date.slice(0, 4)}-${d.draw_date.slice(4, 6)}-${d.draw_date.slice(6, 8)}` : '',
          numbers: Array.isArray(d.numbers) ? [...d.numbers] : [],
          bonus: d.bonus ?? undefined,
        })
      }
      return {
        drawCount: draws.length,
        totalSpent: draws.length * 1000,
        totalWon,
        profit: totalWon - draws.length * 1000,
        wins,
      }
    }),
})