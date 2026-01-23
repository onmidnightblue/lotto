import { z } from 'zod'
import { router, publicProcedure } from '../trpc'
import { db } from '@/lib/db'
import { lottoWinResult, combinationStats } from '@/lib/db/schema'
import { desc, asc, eq, and, or, gte, lte } from 'drizzle-orm'

export const analysisRouter = router({
  missingRange: publicProcedure
    .input(z.object({ weeks: z.number().min(1).max(52).default(3) }))
    .query(async ({ input }) => {
      const results = await db
        .select()
        .from(lottoWinResult)
        .orderBy(desc(lottoWinResult.draw_date))
        .limit(100)

      const numberCounts = new Map<number, number>()
      const lastSeen = new Map<number, number>()

      results.forEach((result, index) => {
        const numbers = (result.numbers as number[]) || []
        numbers.forEach((num) => {
          numberCounts.set(num, (numberCounts.get(num) || 0) + 1)
          lastSeen.set(num, index)
        })
      })

      const missing: Array<{ number: number; missingCount: number }> = []
      const targetWeeks = input.weeks

      for (let num = 1; num <= 45; num++) {
        const lastIndex = lastSeen.get(num) ?? -1
        const missingCount = lastIndex === -1 ? results.length : results.length - 1 - lastIndex
        if (missingCount >= targetWeeks) {
          missing.push({ number: num, missingCount })
        }
      }

      return missing.sort((a, b) => b.missingCount - a.missingCount)
    }),

  // 동반 출현 빈도: 2회 이상 함께 출현한 3개 또는 4개 조합
  cooccurrenceFrequency: publicProcedure
    .input(
      z.object({
        size: z.enum(['3', '4']).default('3'), // 3개 또는 4개 조합
        limit: z.number().min(1).max(10000).optional(), // 페이지네이션을 위해 선택적으로
      })
    )
    .query(async ({ input }) => {
      const type = input.size === '3' ? 'triple' : 'quadruple'

      // combination_stats에서 해당 타입 조합 가져오기 (2회 이상만 필터링)
      const baseQuery = db
        .select()
        .from(combinationStats)
        .where(and(eq(combinationStats.type, type), gte(combinationStats.count, 2)))
        .orderBy(desc(combinationStats.count))

      // limit이 있으면 적용, 없으면 전체 반환 (매우 큰 값으로 설정)
      const results = input.limit 
        ? await baseQuery.limit(input.limit)
        : await baseQuery.limit(10000) // 전체 데이터를 가져오기 위해 충분히 큰 값

      return results.map((r) => ({
        combination: r.numbers as number[],
        count: r.count,
        rank: r.rank,
        rounds: (r.rounds as number[]) || [],
      }))
    }),

  // 동반 미출현 빈도: 1회 이하 함께 출현한 3개 또는 4개 조합
  cooccurrenceMissing: publicProcedure
    .input(
      z.object({
        size: z.enum(['3', '4']).default('3'), // 3개 또는 4개 조합
        limit: z.number().min(1).max(500).default(5),
      })
    )
    .query(async ({ input }) => {
      const type = input.size === '3' ? 'triple' : 'quadruple'

      // combination_stats에서 해당 타입 조합 가져오기 (1회 이하만 필터링)
      const results = await db
        .select()
        .from(combinationStats)
        .where(and(eq(combinationStats.type, type), lte(combinationStats.count, 1)))
        .orderBy(asc(combinationStats.count))
        .limit(input.limit)

      return results.map((r) => ({
        combination: r.numbers as number[],
        count: r.count,
        rank: r.rank,
        rounds: (r.rounds as number[]) || [],
      }))
    }),

  // 궁합 번호 빈도: 최소 30회 이상 함께 나온 2개 번호 조합
  pairAffinity: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(10000).optional(),
      })
    )
    .query(async ({ input }) => {
      const results = await db
        .select()
        .from(combinationStats)
        .where(and(eq(combinationStats.type, 'pair'), gte(combinationStats.count, 30)))
        .orderBy(desc(combinationStats.count))
        .limit(input.limit || 10000)
      
      return results.map((r) => ({
        combination: r.numbers as number[],
        count: r.count,
        rank: r.rank,
        rounds: (r.rounds as number[]) || [],
      }))
    }),

  // 상극 번호 빈도: 최대 30회 미만 함께 나온 2개 번호 조합
  pairConflict: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(10000).optional(),
      })
    )
    .query(async ({ input }) => {
      const results = await db
        .select()
        .from(combinationStats)
        .where(and(eq(combinationStats.type, 'pair'), lte(combinationStats.count, 29))) // 30회 미만 = 29회 이하
        .orderBy(asc(combinationStats.count))
        .limit(input.limit || 10000)
      
      return results.map((r) => ({
        combination: r.numbers as number[],
        count: r.count,
        rank: r.rank,
        rounds: (r.rounds as number[]) || [],
      }))
    }),

  // 최근 n주 동안 한 번도 나오지 않은 번호
  missingNumbers: publicProcedure
    .input(
      z.object({
        weeks: z.number().min(1).max(52).default(4),
        sortBy: z.enum(['date-desc', 'date-asc']).default('date-desc'),
      })
    )
    .query(async ({ input }) => {
      // 항상 최신순으로 정렬해서 가져오기 (최근 n주를 올바르게 선택하기 위해)
      const allResults = await db
        .select()
        .from(lottoWinResult)
        .orderBy(desc(lottoWinResult.draw_date))

      // 최근 n주에 해당하는 회차 수 계산 (n주 = n회차)
      const recentDraws = allResults.slice(0, input.weeks)
      const recentNumbers = new Set<number>()

      recentDraws.forEach((result) => {
        const numbers = (result.numbers as number[]) || []
        numbers.forEach((num) => recentNumbers.add(num))
        recentNumbers.add(result.bonus)
      })

      // 전체 회차에서 마지막으로 나온 회차 추적 (항상 최신순으로 순회하므로 가장 최근 회차가 저장됨)
      const lastSeen = new Map<number, { drawId: number; drawDate: Date }>()

      allResults.forEach((result) => {
        const numbers = (result.numbers as number[]) || []
        numbers.forEach((num) => {
          // 최신순으로 순회하므로, 처음 나오는 것이 가장 최근 회차
          if (!lastSeen.has(num)) {
            lastSeen.set(num, {
              drawId: result.id,
              drawDate: new Date(result.draw_date),
            })
          }
        })
        if (!lastSeen.has(result.bonus)) {
          lastSeen.set(result.bonus, {
            drawId: result.id,
            drawDate: new Date(result.draw_date),
          })
        }
      })

      // 최근 n주 동안 나오지 않은 번호 찾기
      const missing: Array<{ number: number; lastSeen: Date; drawId: number }> = []

      for (let num = 1; num <= 45; num++) {
        if (!recentNumbers.has(num)) {
          const last = lastSeen.get(num)
          if (last) {
            missing.push({
              number: num,
              lastSeen: last.drawDate,
              drawId: last.drawId,
            })
          } else {
            // 한 번도 나온 적 없는 번호
            missing.push({
              number: num,
              lastSeen: new Date(0),
              drawId: 0,
            })
          }
        }
      }

      // 정렬
      missing.sort((a, b) => {
        if (input.sortBy === 'date-desc') {
          return b.lastSeen.getTime() - a.lastSeen.getTime()
        } else {
          return a.lastSeen.getTime() - b.lastSeen.getTime()
        }
      })

      return missing
    }),
})
