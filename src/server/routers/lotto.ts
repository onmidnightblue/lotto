import { z } from 'zod'
import { router, publicProcedure } from '../trpc'
import { db } from '@/lib/db'
import { lottoWinResult } from '@/lib/db/schema'
import { eq, desc, asc, gte, lte, and, or, sql, isNotNull } from 'drizzle-orm'

export const lottoRouter = router({
  getAll: publicProcedure.query(async () => {
    return await db.select().from(lottoWinResult).orderBy(desc(lottoWinResult.draw_date))
  }),

  getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const result = await db.select().from(lottoWinResult).where(eq(lottoWinResult.id, input.id)).limit(1)
    return result[0] ?? null
  }),

  search: publicProcedure
    .input(
      z.object({
        numbers: z.array(z.number().min(1).max(45)).optional(), // 검색할 번호들
        period: z
          .enum(['all', '1year', '6months', '3months', '1month', 'custom'])
          .optional()
          .default('all'),
        customStartDate: z.date().optional(),
        customEndDate: z.date().optional(),
        prizeAmount: z
          .enum(['30억이상', '20억대', '10억대', 'custom'])
          .optional(),
        customPrizeMin: z.number().optional(), // 원 단위
        customPrizeMax: z.number().optional(), // 원 단위
        winnerCount: z.enum(['10명이하', '10명대', '20명대', '30명대']).optional(),
        sortBy: z
          .enum(['date-desc', 'date-asc', 'prize-desc', 'prize-asc', 'winner-desc', 'winner-asc'])
          .optional()
          .default('date-desc'),
        limit: z.number().min(1).max(1000).optional().default(100),
        offset: z.number().min(0).optional().default(0),
      })
    )
    .query(async ({ input }) => {
      let conditions = []

      // 기간 필터
      if (input.period !== 'all') {
        const now = new Date()
        let startDate: Date

        switch (input.period) {
          case '1year':
            startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
            break
          case '6months':
            startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
            break
          case '3months':
            startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
            break
          case '1month':
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
            break
          case 'custom':
            if (input.customStartDate) {
              startDate = input.customStartDate
            } else {
              startDate = new Date(0) // 기본값
            }
            break
          default:
            startDate = new Date(0)
        }

        conditions.push(gte(lottoWinResult.draw_date, startDate))

        if (input.period === 'custom' && input.customEndDate) {
          conditions.push(lte(lottoWinResult.draw_date, input.customEndDate))
        } else if (input.period !== 'custom') {
          conditions.push(lte(lottoWinResult.draw_date, now))
        }
      }

      // 번호 검색 필터
      if (input.numbers && input.numbers.length > 0) {
        // JSON 배열에 모든 번호가 포함되어 있는지 확인 (AND 조건)
        const numberConditions = input.numbers.map((num) => {
          return sql`${lottoWinResult.numbers}::jsonb @> ${JSON.stringify([num])}::jsonb`
        })
        // 보너스 번호도 포함하여 검색
        const bonusConditions = input.numbers.map((num) => {
          return sql`${lottoWinResult.bonus} = ${num}`
        })
        // 모든 번호가 당첨번호 또는 보너스번호에 포함되어야 함
        const allConditions = numberConditions.map((numCond, idx) => {
          return or(numCond, bonusConditions[idx]) as any
        })
        conditions.push(and(...allConditions) as any)
      }

      // 당첨금액 필터
      if (input.prizeAmount) {
        switch (input.prizeAmount) {
          case '30억이상':
            conditions.push(gte(lottoWinResult.prize_amount, 3000000000))
            break
          case '20억대':
            conditions.push(
              and(
                gte(lottoWinResult.prize_amount, 2000000000),
                lte(lottoWinResult.prize_amount, 2999999999)
              ) as any
            )
            break
          case '10억대':
            conditions.push(
              and(
                gte(lottoWinResult.prize_amount, 1000000000),
                lte(lottoWinResult.prize_amount, 1999999999)
              ) as any
            )
            break
          case 'custom':
            if (input.customPrizeMin) {
              conditions.push(gte(lottoWinResult.prize_amount, input.customPrizeMin))
            }
            if (input.customPrizeMax) {
              conditions.push(lte(lottoWinResult.prize_amount, input.customPrizeMax))
            }
            break
        }
      }

      // 당첨자수 필터
      if (input.winnerCount) {
        switch (input.winnerCount) {
          case '10명이하':
            conditions.push(lte(lottoWinResult.winner_count, 10))
            break
          case '10명대':
            conditions.push(
              and(
                gte(lottoWinResult.winner_count, 10),
                lte(lottoWinResult.winner_count, 19)
              ) as any
            )
            break
          case '20명대':
            conditions.push(
              and(
                gte(lottoWinResult.winner_count, 20),
                lte(lottoWinResult.winner_count, 29)
              ) as any
            )
            break
          case '30명대':
            conditions.push(
              and(
                gte(lottoWinResult.winner_count, 30),
                lte(lottoWinResult.winner_count, 39)
              ) as any
            )
            break
        }
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined

      // 정렬
      let orderBy
      switch (input.sortBy) {
        case 'date-asc':
          orderBy = asc(lottoWinResult.draw_date)
          break
        case 'prize-desc':
          orderBy = desc(lottoWinResult.prize_amount)
          break
        case 'prize-asc':
          orderBy = asc(lottoWinResult.prize_amount)
          break
        case 'winner-desc':
          orderBy = desc(lottoWinResult.winner_count)
          break
        case 'winner-asc':
          orderBy = asc(lottoWinResult.winner_count)
          break
        default:
          orderBy = desc(lottoWinResult.draw_date)
      }

      // 번호 검색 시 중복 제거를 위해 DISTINCT 사용
      const results = await db
        .select()
        .from(lottoWinResult)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(input.limit)
        .offset(input.offset)

      // 전체 개수 조회 (중복 제거)
      const countResult = await db
        .select({ count: sql<number>`count(DISTINCT ${lottoWinResult.id})` })
        .from(lottoWinResult)
        .where(whereClause)

      return {
        results,
        total: Number(countResult[0]?.count || 0),
      }
    }),

  create: publicProcedure
    .input(
      z.object({
        draw_date: z.date(),
        numbers: z.array(z.number().min(1).max(45)).length(6),
        bonus: z.number().min(1).max(45),
      })
    )
    .mutation(async ({ input }) => {
      const [result] = await db
        .insert(lottoWinResult)
        .values({
          draw_date: input.draw_date,
          numbers: input.numbers,
          bonus: input.bonus,
        })
        .returning()
      return result
    }),
})
