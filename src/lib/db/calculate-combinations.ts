import { db } from './client'
import { combinationStats } from './schema'
import * as fs from 'fs'
import * as path from 'path'

/**
 * 동반/궁합/원수 조합 계산 및 저장 (CSV 파일에서 직접 읽기)
 */
async function calculateCombinations() {
  try {
    console.log('🔄 Starting combination calculation from CSV...')

    // CSV 파일 읽기
    const csvPath = path.join(__dirname, 'data', 'lotto_data.csv')
    const csvContent = fs.readFileSync(csvPath, 'utf-8')
    const lines = csvContent.split('\n').filter(line => line.trim())
    
    // 헤더 제거
    const dataLines = lines.slice(1)
    console.log(`📊 Analyzing ${dataLines.length} draws from CSV...`)

    // 3개 조합 카운트 및 회차 추적
    const tripleCounts = new Map<string, { count: number; rounds: number[] }>()
    // 4개 조합 카운트 및 회차 추적
    const quadrupleCounts = new Map<string, { count: number; rounds: number[] }>()
    // 2개 조합 카운트 및 회차 추적 (궁합/원수 구분 없이 일단 카운트)
    const pairCounts = new Map<string, { count: number; rounds: number[] }>()

    // CSV 파일에서 모든 회차를 순회하며 조합 계산
    for (const line of dataLines) {
      if (!line.trim()) continue
      
      const parts = line.split(',')
      if (parts.length < 9) continue
      
      const round = parseInt(parts[0], 10)
      const numbers = [
        parseInt(parts[2], 10),
        parseInt(parts[3], 10),
        parseInt(parts[4], 10),
        parseInt(parts[5], 10),
        parseInt(parts[6], 10),
        parseInt(parts[7], 10),
      ]
      const bonus = parseInt(parts[8], 10)
      
      if (numbers.some(n => isNaN(n)) || isNaN(bonus) || isNaN(round)) continue

      // 보너스 번호를 포함한 전체 번호 배열 (7개)
      const allNumbers = [...numbers, bonus]

      // 3개 조합: 기본 번호 6개에서 C(6,3) = 20개 + 보너스 포함 조합
      // 기본 번호만 사용한 조합 (C(6,3) = 20개)
      for (let i = 0; i < numbers.length - 2; i++) {
        for (let j = i + 1; j < numbers.length - 1; j++) {
          for (let k = j + 1; k < numbers.length; k++) {
            const combo = [numbers[i], numbers[j], numbers[k]].sort((a, b) => a - b)
            const key = combo.join(',')
            const existing = tripleCounts.get(key) || { count: 0, rounds: [] }
            // 중복 회차 체크 (같은 회차에서 같은 조합이 여러 번 카운트되지 않도록)
            if (!existing.rounds.includes(round)) {
              tripleCounts.set(key, {
                count: existing.count + 1,
                rounds: [...existing.rounds, round],
              })
            }
          }
        }
      }
      // 보너스 번호를 포함한 조합 (보너스 + 기본 번호 2개)
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

      // 4개 조합: 기본 번호 6개에서 C(6,4) = 15개 + 보너스 포함 조합
      // 기본 번호만 사용한 조합 (C(6,4) = 15개)
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
      // 보너스 번호를 포함한 조합 (보너스 + 기본 번호 3개)
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

      // 2개 조합: 기본 번호 6개에서 C(6,2) = 15개 + 보너스 포함 조합
      // 기본 번호만 사용한 조합 (C(6,2) = 15개)
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
      // 보너스 번호를 포함한 조합 (보너스 + 기본 번호 1개)
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

    // 3개 조합 결과 변환
    const tripleResults = Array.from(tripleCounts.entries())
      .map(([key, data]) => ({
        combination: key.split(',').map(Number),
        count: data.count,
        rounds: data.rounds,
      }))
      .sort((a, b) => b.count - a.count)

    // 4개 조합 결과 변환
    const quadrupleResults = Array.from(quadrupleCounts.entries())
      .map(([key, data]) => ({
        combination: key.split(',').map(Number),
        count: data.count,
        rounds: data.rounds,
      }))
      .sort((a, b) => b.count - a.count)

    // 2개 조합 결과 변환
    // 궁합/원수 구분: 전체 평균 출현 횟수 기준으로 판단
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

    console.log(`✅ Calculated ${tripleResults.length} triple combinations`)
    console.log(`✅ Calculated ${quadrupleResults.length} quadruple combinations`)
    console.log(`✅ Calculated ${pairResults.length} pair combinations`)

    // 기존 combination_stats 데이터 삭제
    await db.delete(combinationStats)
    console.log('🗑️  Deleted existing combination_stats data')

    // rank 계산 함수: 같은 count를 가진 조합들은 같은 rank를 가짐
    const assignRanks = (
      items: Array<{ combination: number[]; count: number; rounds: number[] }>
    ) => {
      let currentRank = 1
      let previousCount: number | null = null
      
      return items.map((item) => {
        if (previousCount !== null && item.count < previousCount) {
          // count가 줄어들면 다음 rank로 증가
          currentRank++
        }
        previousCount = item.count
        return {
          ...item,
          rank: currentRank,
        }
      })
    }

    // 배치 삽입 함수
    const batchInsert = async (
      items: Array<{ combination: number[]; count: number; rounds: number[]; rank: number }>,
      type: string,
      batchSize: number = 1000
    ) => {
      let inserted = 0
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
        inserted += batch.length
        console.log(`   Inserted ${inserted}/${items.length} ${type} combinations...`)
      }
      return inserted
    }

    // 모든 조합 저장 (필터링 없이)
    // Triple 조합 저장 (모든 조합)
    if (tripleResults.length > 0) {
      const tripleWithRanks = assignRanks(tripleResults)
      const count = await batchInsert(tripleWithRanks, 'triple')
      console.log(`💾 Saved ${count} triple combinations`)
    }

    // Quadruple 조합 저장 (모든 조합)
    if (quadrupleResults.length > 0) {
      const quadrupleWithRanks = assignRanks(quadrupleResults)
      const count = await batchInsert(quadrupleWithRanks, 'quadruple')
      console.log(`💾 Saved ${count} quadruple combinations`)
    }

    // Pair 조합 저장 (모든 조합)
    if (pairResults.length > 0) {
      const pairWithRanks = assignRanks(pairResults)
      const count = await batchInsert(pairWithRanks, 'pair')
      console.log(`💾 Saved ${count} pair combinations`)
    }

    console.log(`✨ Successfully saved combination data!`)
    console.log(`   - Triple: ${tripleResults.length} combinations`)
    console.log(`   - Quadruple: ${quadrupleResults.length} combinations`)
    console.log(`   - Pair: ${pairResults.length} combinations`)
    process.exit(0)
  } catch (error) {
    console.error('❌ Error calculating combinations:', error)
    process.exit(1)
  }
}

calculateCombinations()
