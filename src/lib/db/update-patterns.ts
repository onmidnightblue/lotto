import { db } from './client'
import { lottoWinResult } from './schema'
import { eq } from 'drizzle-orm'

/**
 * 기존 lotto_win_result 데이터에 홀짝/고저/총합 계산 및 업데이트
 */
async function updatePatterns() {
  try {
    console.log('🔄 Starting pattern update...')

    const allResults = await db.select().from(lottoWinResult)

    console.log(`📊 Found ${allResults.length} records to update`)

    let updated = 0
    const batchSize = 100

    for (let i = 0; i < allResults.length; i += batchSize) {
      const batch = allResults.slice(i, i + batchSize)

      for (const result of batch) {
        const numbers = (result.numbers as number[]) || []
        if (numbers.length !== 6) continue

        // 홀짝 계산
        const odd = numbers.filter((n) => n % 2 === 1).length
        const even = numbers.filter((n) => n % 2 === 0).length

        // 고저 계산 (23 이상 = high, 23 미만 = low)
        const high = numbers.filter((n) => n >= 23).length
        const low = numbers.filter((n) => n < 23).length

        // 총합 계산
        const totalSum = numbers.reduce((sum, n) => sum + n, 0)

        await db
          .update(lottoWinResult)
          .set({
            odd_even: { odd, even },
            high_low: { high, low },
            total_sum: totalSum,
          })
          .where(eq(lottoWinResult.id, result.id))

        updated++
      }

      console.log(`   Updated ${updated}/${allResults.length} records...`)
    }

    console.log(`✨ Successfully updated ${updated} records!`)
    process.exit(0)
  } catch (error) {
    console.error('❌ Error updating patterns:', error)
    process.exit(1)
  }
}

updatePatterns()
