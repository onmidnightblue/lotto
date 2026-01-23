import { z } from 'zod'
import { router, publicProcedure } from '../trpc'
import { db } from '@/lib/db'
import { lottoWinResult } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'

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
})
