import { asc } from 'drizzle-orm'
import { db } from './client'
import { combinationStats, numbers } from './schema'

/**
 * 동반/궁합/원수 조합 계산 및 저장 (lotto_win_result DB에서 읽기)
 */
async function calculateCombinations() {
  try {
    console.log('🔄 Starting combination calculation from lotto_win_result...')

    const rows = await db
      .select({
        round: numbers.round,
        numbers: numbers.numbers,
        bonus: numbers.bonus,
      })
      .from(numbers)
      .orderBy(asc(numbers.round))

    console.log(`📊 Analyzing ${rows.length} draws from DB...`)

    const tripleCounts = new Map<string, { count: number; rounds: number[] }>()
    const quadrupleCounts = new Map<string, { count: number; rounds: number[] }>()
    const pairCounts = new Map<string, { count: number; rounds: number[] }>()

    for (const row of rows) {
      const round = row.round
      const numbers = Array.isArray(row.numbers) ? row.numbers : []
      const bonus = row.bonus

      if (numbers.length !== 6 || bonus == null) continue

      // 3개 조합: 기본 번호 6개에서 C(6,3) = 20개 + 보너스 포함 조합
      for (let i = 0; i < numbers.length - 2; i++) {
        for (let j = i + 1; j < numbers.length - 1; j++) {
          for (let k = j + 1; k < numbers.length; k++) {
            const combo = [numbers[i], numbers[j], numbers[k]].sort((a, b) => a - b)
            const key = combo.join(',')
            const existing = tripleCounts.get(key) || { count: 0, rounds: [] }
            if (!existing.rounds.includes(round)) {
              tripleCounts.set(key, {
                count: existing.count + 1,
                rounds: [...existing.rounds, round],
              })
            }
          }
        }
      }
      for (let i = 0; i < numbers.length - 1; i++) {
        for (let j = i + 1; j < numbers.length; j++) {
          const combo = [bonus, numbers[i], numbers[j]].sort((a, b) => a - b)
          const key = combo.join(',')
          const existing = tripleCounts.get(key) || { count: 0, rounds: [] }
          if (!existing.rounds.includes(round)) {
            tripleCounts.set(key, {
              count: existing.count + 1,
              rounds: [...existing.rounds, round],
            })
          }
        }
      }

      // 4개 조합
      for (let i = 0; i < numbers.length - 3; i++) {
        for (let j = i + 1; j < numbers.length - 2; j++) {
          for (let k = j + 1; k < numbers.length - 1; k++) {
            for (let l = k + 1; l < numbers.length; l++) {
              const combo = [numbers[i], numbers[j], numbers[k], numbers[l]].sort((a, b) => a - b)
              const key = combo.join(',')
              const existing = quadrupleCounts.get(key) || { count: 0, rounds: [] }
              if (!existing.rounds.includes(round)) {
                quadrupleCounts.set(key, {
                  count: existing.count + 1,
                  rounds: [...existing.rounds, round],
                })
              }
            }
          }
        }
      }
      for (let i = 0; i < numbers.length - 2; i++) {
        for (let j = i + 1; j < numbers.length - 1; j++) {
          for (let k = j + 1; k < numbers.length; k++) {
            const combo = [bonus, numbers[i], numbers[j], numbers[k]].sort((a, b) => a - b)
            const key = combo.join(',')
            const existing = quadrupleCounts.get(key) || { count: 0, rounds: [] }
            if (!existing.rounds.includes(round)) {
              quadrupleCounts.set(key, {
                count: existing.count + 1,
                rounds: [...existing.rounds, round],
              })
            }
          }
        }
      }

      // 2개 조합
      for (let i = 0; i < numbers.length - 1; i++) {
        for (let j = i + 1; j < numbers.length; j++) {
          const combo = [numbers[i], numbers[j]].sort((a, b) => a - b)
          const key = combo.join(',')
          const existing = pairCounts.get(key) || { count: 0, rounds: [] }
          if (!existing.rounds.includes(round)) {
            pairCounts.set(key, {
              count: existing.count + 1,
              rounds: [...existing.rounds, round],
            })
          }
        }
      }
      for (let i = 0; i < numbers.length; i++) {
        const combo = [bonus, numbers[i]].sort((a, b) => a - b)
        const key = combo.join(',')
        const existing = pairCounts.get(key) || { count: 0, rounds: [] }
        if (!existing.rounds.includes(round)) {
          pairCounts.set(key, {
            count: existing.count + 1,
            rounds: [...existing.rounds, round],
          })
        }
      }
    }

    const tripleResults = Array.from(tripleCounts.entries())
      .map(([key, data]) => ({
        combination: key.split(',').map(Number),
        count: data.count,
        rounds: data.rounds,
      }))
      .sort((a, b) => b.count - a.count)

    const quadrupleResults = Array.from(quadrupleCounts.entries())
      .map(([key, data]) => ({
        combination: key.split(',').map(Number),
        count: data.count,
        rounds: data.rounds,
      }))
      .sort((a, b) => b.count - a.count)

    const avgPairCount =
      Array.from(pairCounts.values()).reduce((a, b) => a + b.count, 0) / pairCounts.size
    const pairResults = Array.from(pairCounts.entries())
      .map(([key, data]) => ({
        combination: key.split(',').map(Number),
        count: data.count,
        rounds: data.rounds,
        type: data.count >= avgPairCount ? ('affinity' as const) : ('conflict' as const),
      }))
      .sort((a, b) => b.count - a.count)

    console.log(`📊 Pair average count: ${avgPairCount.toFixed(2)}`)
    console.log(`✅ Calculated ${tripleResults.length} triple, ${quadrupleResults.length} quadruple, ${pairResults.length} pair combinations`)

    await db.delete(combinationStats)
    console.log('🗑️  Deleted existing combination_stats data')

    const assignRanks = (
      items: Array<{ combination: number[]; count: number; rounds: number[] }>
    ) => {
      let currentRank = 1
      let previousCount: number | null = null
      return items.map((item) => {
        if (previousCount !== null && item.count < previousCount) currentRank++
        previousCount = item.count
        return { ...item, rank: currentRank }
      })
    }

    const batchInsert = async (
      items: Array<{ combination: number[]; count: number; rounds: number[]; rank: number }>,
      type: string,
      batchSize = 1000
    ) => {
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize)
        await db.insert(combinationStats).values(
          batch.map((item) => ({
            type,
            numbers: item.combination,
            count: item.count,
            rank: item.rank,
            rounds: item.rounds,
          }))
        )
        console.log(`   Inserted ${Math.min(i + batchSize, items.length)}/${items.length} ${type}...`)
      }
    }

    if (tripleResults.length > 0) {
      await batchInsert(assignRanks(tripleResults), 'triple')
      console.log(`💾 Saved ${tripleResults.length} triple combinations`)
    }
    if (quadrupleResults.length > 0) {
      await batchInsert(assignRanks(quadrupleResults), 'quadruple')
      console.log(`💾 Saved ${quadrupleResults.length} quadruple combinations`)
    }
    if (pairResults.length > 0) {
      await batchInsert(assignRanks(pairResults), 'pair')
      console.log(`💾 Saved ${pairResults.length} pair combinations`)
    }

    console.log('✨ Successfully saved combination data!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error calculating combinations:', error)
    process.exit(1)
  }
}

calculateCombinations()
