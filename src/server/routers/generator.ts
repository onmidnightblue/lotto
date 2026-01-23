import { z } from 'zod'
import { router, publicProcedure } from '../trpc'
import { db } from '@/lib/db'
import { lottoWinResult, combinationStats } from '@/lib/db/schema'
import { desc, eq, and, gte } from 'drizzle-orm'

// 번호대 구분 (1-10, 11-20, 21-30, 31-40, 41-45)
function getNumberRange(num: number): number {
  if (num <= 10) return 1
  if (num <= 20) return 2
  if (num <= 30) return 3
  if (num <= 40) return 4
  return 5
}

// 일의 자리수 추출
function getOnesDigit(num: number): number {
  return num % 10
}

// 연속된 숫자 개수 확인
function countConsecutive(numbers: number[]): number {
  const sorted = [...numbers].sort((a, b) => a - b)
  let maxConsecutive = 1
  let current = 1
  
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] + 1) {
      current++
      maxConsecutive = Math.max(maxConsecutive, current)
    } else {
      current = 1
    }
  }
  
  return maxConsecutive
}

// 번호 생성 함수
function generateNumbers(
  preset: 'balanced' | 'aggressive' | 'defensive' | 'custom',
  options?: {
    includeNumbers?: number[]
    excludeNumbers?: number[]
    oddEven?: [number, number]
    numberRanges?: number[]
    sumRange?: [number, number]
    latestRoundNumbers?: number[] // 직전 회차 번호 목록 (낭만형/공격형에서 1개만 포함되도록 체크)
  }
): number[] {
  const includeNumbers = options?.includeNumbers || []
  const excludeNumbers = options?.excludeNumbers || []
  
  // 최대 100번 시도
  for (let attempt = 0; attempt < 100; attempt++) {
    const result = new Set<number>()
    
    // 필수 포함 번호 추가
    // 낭만형/공격형: 직전 회차 번호는 정확히 1개만 포함
    if ((preset === 'defensive' || preset === 'aggressive') && options?.latestRoundNumbers && options.latestRoundNumbers.length > 0) {
      // 직전 회차 번호와 일반 번호를 분리
      const latestInInclude = includeNumbers.filter(n => options.latestRoundNumbers!.includes(n))
      const nonLatestInInclude = includeNumbers.filter(n => !options.latestRoundNumbers!.includes(n))
      
      // 직전 회차 번호 중 하나만 포함
      if (latestInInclude.length > 0) {
        const selectedLatest = latestInInclude[0]
        result.add(selectedLatest)
      }
      
      // 나머지 번호 추가 (직전 회차 번호 제외)
      nonLatestInInclude.forEach(num => {
        if (num >= 1 && num <= 45 && !excludeNumbers.includes(num)) {
          result.add(num)
        }
      })
    } else {
      // 일반적인 경우
      includeNumbers.forEach(num => {
        if (num >= 1 && num <= 45 && !excludeNumbers.includes(num)) {
          result.add(num)
        }
      })
    }
    
      // 6개가 될 때까지 랜덤 선택
      // 낭만형/공격형일 때는 직전 회차 번호를 제외한 후보만 사용
      let candidates = Array.from({ length: 45 }, (_, i) => i + 1)
        .filter(num => !result.has(num) && !excludeNumbers.includes(num))
      
      if ((preset === 'defensive' || preset === 'aggressive') && options?.latestRoundNumbers && options.latestRoundNumbers.length > 0) {
        // 이미 포함된 직전 회차 번호 개수 확인
        const currentLatestCount = Array.from(result).filter(n => options.latestRoundNumbers!.includes(n)).length
        
        if (currentLatestCount >= 1) {
          // 이미 직전 회차 번호가 1개 이상 포함되어 있으면 더 이상 직전 회차 번호는 추가하지 않음
          candidates = candidates.filter(n => !options.latestRoundNumbers!.includes(n))
        }
      }
    
    while (result.size < 6 && candidates.length > 0) {
      const randomIndex = Math.floor(Math.random() * candidates.length)
      const num = candidates[randomIndex]
      candidates.splice(randomIndex, 1)
      
      // 낭만형/공격형: 직전 회차 번호가 이미 1개 포함되어 있으면 더 추가하지 않음
      if ((preset === 'defensive' || preset === 'aggressive') && options?.latestRoundNumbers && options.latestRoundNumbers.length > 0) {
        const currentLatestCount = Array.from(result).filter(n => options.latestRoundNumbers!.includes(n)).length
        if (currentLatestCount >= 1 && options.latestRoundNumbers.includes(num)) {
          continue // 직전 회차 번호는 더 이상 추가하지 않음
        }
      }
      
      const temp = Array.from(result)
      temp.push(num)
      
      // 중간 단계에서는 가능성만 체크
      if (temp.length < 6) {
        result.add(num)
        continue
      }
      
      // 6개가 되었을 때만 전체 조건 체크
      let isValid = true
      
      // 홀짝 비율 체크
      if (options?.oddEven) {
        const odd = temp.filter(n => n % 2 === 1).length
        const even = temp.length - odd
        if (odd !== options.oddEven[0] || even !== options.oddEven[1]) {
          isValid = false
        }
      }
      
      // 총합 범위 체크
      if (options?.sumRange) {
        const sum = temp.reduce((a, b) => a + b, 0)
        if (sum < options.sumRange[0] || sum > options.sumRange[1]) {
          isValid = false
        }
      }
      
      // 균형형: 번호대 분산 체크
      if (preset === 'balanced') {
        const ranges = new Set(temp.map(getNumberRange))
        if (ranges.size < 3) {
          isValid = false
        }
        const rangeCounts = new Map<number, number>()
        temp.forEach(n => {
          const r = getNumberRange(n)
          rangeCounts.set(r, (rangeCounts.get(r) || 0) + 1)
        })
        if (Array.from(rangeCounts.values()).some(count => count >= 4)) {
          isValid = false
        }
        if (countConsecutive(temp) > 2) {
          isValid = false
        }
      }
      
      // 낭만형: 일의 자리 같은 숫자 최대 2개
      if (preset === 'defensive') {
        const onesDigits = temp.map(getOnesDigit)
        const onesCount = new Map<number, number>()
        onesDigits.forEach(d => {
          onesCount.set(d, (onesCount.get(d) || 0) + 1)
        })
        if (Array.from(onesCount.values()).some(count => count > 2)) {
          isValid = false
        }
        
        // 직전 회차 번호가 1개만 포함되어야 함
        if (options?.latestRoundNumbers && options.latestRoundNumbers.length > 0) {
          const latestCount = temp.filter(n => options.latestRoundNumbers!.includes(n)).length
          if (latestCount !== 1) {
            isValid = false
          }
        }
      }
      
      // 공격형: 직전 회차 번호가 1개만 포함되어야 함
      if (preset === 'aggressive') {
        if (options?.latestRoundNumbers && options.latestRoundNumbers.length > 0) {
          const latestCount = temp.filter(n => options.latestRoundNumbers!.includes(n)).length
          if (latestCount !== 1) {
            isValid = false
          }
        }
      }
      
      // 직접조율 모드: 번호대 체크
      if (preset === 'custom' && options?.numberRanges && options.numberRanges.length > 0) {
        const numRange = getNumberRange(num)
        if (!options.numberRanges.includes(numRange)) {
          isValid = false
        }
      }
      
      if (isValid) {
        result.add(num)
        break
      }
    }
    
    const final = Array.from(result)
    
    // 최종 검증
    if (final.length === 6) {
      let allValid = true
      
      // 홀짝 비율 최종 체크
      if (options?.oddEven) {
        const odd = final.filter(n => n % 2 === 1).length
        const even = final.length - odd
        if (odd !== options.oddEven[0] || even !== options.oddEven[1]) {
          allValid = false
        }
      }
      
      // 총합 범위 최종 체크
      if (options?.sumRange) {
        const sum = final.reduce((a, b) => a + b, 0)
        if (sum < options.sumRange[0] || sum > options.sumRange[1]) {
          allValid = false
        }
      }
      
      // 균형형 최종 체크
      if (preset === 'balanced') {
        const ranges = new Set(final.map(getNumberRange))
        if (ranges.size < 3) {
          allValid = false
        }
        const rangeCounts = new Map<number, number>()
        final.forEach(n => {
          const r = getNumberRange(n)
          rangeCounts.set(r, (rangeCounts.get(r) || 0) + 1)
        })
        if (Array.from(rangeCounts.values()).some(count => count >= 4)) {
          allValid = false
        }
        if (countConsecutive(final) > 2) {
          allValid = false
        }
      }
      
      // 낭만형 최종 체크
      if (preset === 'defensive') {
        const onesDigits = final.map(getOnesDigit)
        const onesCount = new Map<number, number>()
        onesDigits.forEach(d => {
          onesCount.set(d, (onesCount.get(d) || 0) + 1)
        })
        if (Array.from(onesCount.values()).some(count => count > 2)) {
          allValid = false
        }
        
        // 직전 회차 번호가 1개만 포함되어야 함
        if (options?.latestRoundNumbers && options.latestRoundNumbers.length > 0) {
          const latestCount = final.filter(n => options.latestRoundNumbers!.includes(n)).length
          if (latestCount !== 1) {
            allValid = false
          }
        }
      }
      
      // 공격형 최종 체크: 직전 회차 번호가 1개만 포함되어야 함
      if (preset === 'aggressive') {
        if (options?.latestRoundNumbers && options.latestRoundNumbers.length > 0) {
          const latestCount = final.filter(n => options.latestRoundNumbers!.includes(n)).length
          if (latestCount !== 1) {
            allValid = false
          }
        }
      }
      
      if (allValid) {
        // 최종 조정: 홀짝 비율이 맞지 않으면 조정
        // 단, 낭만형/공격형에서는 직전 회차 번호 개수와 홀짝 비율을 모두 만족해야 함
        if (options?.oddEven) {
          const odd = final.filter(n => n % 2 === 1).length
          const even = final.length - odd
          if (odd !== options.oddEven[0] || even !== options.oddEven[1]) {
            // 낭만형/공격형: 직전 회차 번호 개수 확인
            let latestCount = 0
            if ((preset === 'defensive' || preset === 'aggressive') && options?.latestRoundNumbers) {
              latestCount = final.filter(n => options.latestRoundNumbers!.includes(n)).length
            }
            
            const neededOdd = options.oddEven[0] - odd
            if (neededOdd > 0) {
              // 홀수가 부족하면 짝수를 홀수로 교체
              // 단, 직전 회차 번호는 교체하지 않음
              const evenNums = final.filter(n => {
                if (preset === 'defensive' || preset === 'aggressive') {
                  return n % 2 === 0 && (!options?.latestRoundNumbers || !options.latestRoundNumbers.includes(n))
                }
                return n % 2 === 0
              })
              const candidates = Array.from({ length: 45 }, (_, i) => i + 1)
                .filter(n => {
                  if (n % 2 !== 1) return false
                  if (final.includes(n)) return false
                  if (excludeNumbers.includes(n)) return false
                  // 낭만형/공격형: 직전 회차 번호는 추가하지 않음
                  if ((preset === 'defensive' || preset === 'aggressive') && options?.latestRoundNumbers) {
                    if (latestCount >= 1 && options.latestRoundNumbers.includes(n)) return false
                  }
                  return true
                })
              
              for (let i = 0; i < neededOdd && evenNums.length > 0 && candidates.length > 0; i++) {
                const evenNum = evenNums[i]
                const oddNum = candidates[Math.floor(Math.random() * candidates.length)]
                const index = final.indexOf(evenNum)
                if (index !== -1) {
                  final[index] = oddNum
                  candidates.splice(candidates.indexOf(oddNum), 1)
                }
              }
            } else if (neededOdd < 0) {
              // 홀수가 많으면 홀수를 짝수로 교체
              // 단, 직전 회차 번호는 교체하지 않음
              const oddNums = final.filter(n => {
                if (preset === 'defensive' || preset === 'aggressive') {
                  return n % 2 === 1 && (!options?.latestRoundNumbers || !options.latestRoundNumbers.includes(n))
                }
                return n % 2 === 1
              })
              const candidates = Array.from({ length: 45 }, (_, i) => i + 1)
                .filter(n => {
                  if (n % 2 !== 0) return false
                  if (final.includes(n)) return false
                  if (excludeNumbers.includes(n)) return false
                  // 낭만형/공격형: 직전 회차 번호는 추가하지 않음
                  if ((preset === 'defensive' || preset === 'aggressive') && options?.latestRoundNumbers) {
                    if (latestCount >= 1 && options.latestRoundNumbers.includes(n)) return false
                  }
                  return true
                })
              
              for (let i = 0; i < Math.abs(neededOdd) && oddNums.length > 0 && candidates.length > 0; i++) {
                const oddNum = oddNums[i]
                const evenNum = candidates[Math.floor(Math.random() * candidates.length)]
                const index = final.indexOf(oddNum)
                if (index !== -1) {
                  final[index] = evenNum
                  candidates.splice(candidates.indexOf(evenNum), 1)
                }
              }
            }
            
            // 홀짝 비율 조정 후 직전 회차 번호 개수 재확인
            if ((preset === 'defensive' || preset === 'aggressive') && options?.latestRoundNumbers) {
              const newLatestCount = final.filter(n => options.latestRoundNumbers!.includes(n)).length
              if (newLatestCount !== 1) {
                // 직전 회차 번호가 1개가 아니면 재시도하지 않고 그대로 반환 (다음 시도에서 처리)
                allValid = false
              }
            }
          }
        }
        
        // 균형형: 번호대 분산 최종 조정
        if (preset === 'balanced') {
          const ranges = new Set(final.map(getNumberRange))
          if (ranges.size < 3) {
            // 번호대가 3개 미만이면 조정
            const rangeCounts = new Map<number, number>()
            final.forEach(n => {
              const r = getNumberRange(n)
              rangeCounts.set(r, (rangeCounts.get(r) || 0) + 1)
            })
            
            // 가장 많이 나온 번호대에서 하나를 다른 번호대로 교체
            const maxRange = Array.from(rangeCounts.entries())
              .sort((a, b) => b[1] - a[1])[0]?.[0]
            
            if (maxRange) {
              const numInMaxRange = final.find(n => getNumberRange(n) === maxRange)
              if (numInMaxRange) {
                const targetRanges = [1, 2, 3, 4, 5].filter(r => r !== maxRange && !ranges.has(r))
                if (targetRanges.length > 0) {
                  const targetRange = targetRanges[0]
                  const candidates = Array.from({ length: 45 }, (_, i) => i + 1)
                    .filter(n => getNumberRange(n) === targetRange && !final.includes(n) && !excludeNumbers.includes(n))
                  
                  if (candidates.length > 0) {
                    const replacement = candidates[Math.floor(Math.random() * candidates.length)]
                    const index = final.indexOf(numInMaxRange)
                    if (index !== -1) {
                      final[index] = replacement
                    }
                  }
                }
              }
            }
          }
        }
        
        return final.sort((a, b) => a - b)
      }
    }
  }
  
  // 모든 시도 실패 시 기본 조합 반환
  const fallback = new Set<number>()
  includeNumbers.forEach(n => {
    if (n >= 1 && n <= 45) fallback.add(n)
  })
  const allCandidates = Array.from({ length: 45 }, (_, i) => i + 1)
    .filter(n => !fallback.has(n) && !excludeNumbers.includes(n))
  
  while (fallback.size < 6 && allCandidates.length > 0) {
    const randomIndex = Math.floor(Math.random() * allCandidates.length)
    fallback.add(allCandidates[randomIndex])
    allCandidates.splice(randomIndex, 1)
  }
  
  return Array.from(fallback).sort((a, b) => a - b)
}

export const generatorRouter = router({
  generatePreset: publicProcedure
    .input(z.object({ preset: z.enum(['balanced', 'aggressive', 'defensive']) }))
    .mutation(async ({ input }) => {
      const recentResults = await db
        .select()
        .from(lottoWinResult)
        .orderBy(desc(lottoWinResult.draw_date))
        .limit(100)

      if (input.preset === 'balanced') {
        // 균형형: 최근 5주 이내 출현 번호 3개 + 10주 이상 미출현 번호 3개
        const recent5WeeksNumbers = new Set<number>()
        recentResults.slice(0, 5).forEach(r => {
          const nums = (r.numbers as number[]) || []
          nums.forEach(n => recent5WeeksNumbers.add(n))
          recent5WeeksNumbers.add(r.bonus)
        })
        
        const allResults = await db
          .select()
          .from(lottoWinResult)
          .orderBy(desc(lottoWinResult.draw_date))
          .limit(1000)
        
        const lastSeenIndex = new Map<number, number>()
        allResults.forEach((result, index) => {
          const nums = (result.numbers as number[]) || []
          nums.forEach((num) => {
            if (!lastSeenIndex.has(num)) {
              lastSeenIndex.set(num, index)
            }
          })
          if (!lastSeenIndex.has(result.bonus)) {
            lastSeenIndex.set(result.bonus, index)
          }
        })
        
        const missingNumbersWithIndex: Array<{ number: number; lastSeenIndex: number }> = []
        for (let i = 1; i <= 45; i++) {
          const lastIndex = lastSeenIndex.get(i)
          if (lastIndex === undefined || lastIndex >= 10) {
            missingNumbersWithIndex.push({
              number: i,
              lastSeenIndex: lastIndex ?? allResults.length,
            })
          }
        }
        
        missingNumbersWithIndex.sort((a, b) => b.lastSeenIndex - a.lastSeenIndex)
        const topMissing = missingNumbersWithIndex.slice(0, 10)
        const selectedMissing = topMissing
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
          .map(item => item.number)
        
        const recent5Array = Array.from(recent5WeeksNumbers)
        const selectedRecent = recent5Array
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
        
        return generateNumbers('balanced', {
          includeNumbers: [...selectedMissing, ...selectedRecent],
          oddEven: [3, 3],
          sumRange: [100, 175],
        })
      } else if (input.preset === 'aggressive') {
        // 공격형: 최근 10주 내 가장 많이 나온 번호 3개 (직전 회차 번호 포함 가능) + 직전 회차 번호 1개 (이미 있으면 건너뜀) + 궁합 번호 2개 (직전 회차 번호 1개가 이미 있으면 건너뜀) + 부족한 번호는 가장 많이 나온 번호로 보충
        const latestAll = [
          ...((recentResults[0]?.numbers as number[]) || []),
          recentResults[0]?.bonus || 0,
        ].filter(n => n > 0)
        
        const numberCounts = new Map<number, number>()
        recentResults.slice(0, 10).forEach(r => {
          const nums = (r.numbers as number[]) || []
          nums.forEach(n => {
            numberCounts.set(n, (numberCounts.get(n) || 0) + 1)
          })
          numberCounts.set(r.bonus, (numberCounts.get(r.bonus) || 0) + 1)
        })
        
        // 가장 많이 나온 번호 선택 (직전 회차 번호 포함 가능)
        const allFrequentNumbers = Array.from(numberCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([num]) => num)
        
        const frequentNumbers = allFrequentNumbers.slice(0, 3)
        
        // 직전 회차 번호 1개 추가 (이미 frequentNumbers에 포함되어 있으면 건너뜀)
        const finalNumbers = new Set<number>(frequentNumbers)
        const latestInFrequent = frequentNumbers.filter(n => latestAll.includes(n))
        if (latestInFrequent.length === 0) {
          // 직전 회차 번호가 frequentNumbers에 없으면 추가
          const latestOne = latestAll[Math.floor(Math.random() * latestAll.length)]
          finalNumbers.add(latestOne)
        }
        
        // 가장 많이 나온 번호의 궁합 번호 찾기
        const topPairs = await db
          .select()
          .from(combinationStats)
          .where(and(eq(combinationStats.type, 'pair'), gte(combinationStats.count, 30)))
          .orderBy(desc(combinationStats.count))
          .limit(100)
        
        const pairCandidates: number[] = []
        const topFrequentNumber = frequentNumbers[0]
        
        // 직전 회차 번호가 이미 포함되어 있는지 확인
        const hasLatest = Array.from(finalNumbers).some(n => latestAll.includes(n))
        
        for (const pair of topPairs) {
          const pairNums = (pair.numbers as number[]) || []
          if (pairNums.length === 2) {
            const [num1, num2] = pairNums
            if (num1 === topFrequentNumber && !finalNumbers.has(num2)) {
              // 직전 회차 번호가 이미 1개 있으면 건너뜀
              if (hasLatest && latestAll.includes(num2)) continue
              pairCandidates.push(num2)
            } else if (num2 === topFrequentNumber && !finalNumbers.has(num1)) {
              // 직전 회차 번호가 이미 1개 있으면 건너뜀
              if (hasLatest && latestAll.includes(num1)) continue
              pairCandidates.push(num1)
            }
          }
        }
        
        const selectedPair = pairCandidates
          .filter(n => !finalNumbers.has(n))
          .sort(() => Math.random() - 0.5)
          .slice(0, 2)
        
        selectedPair.forEach(n => finalNumbers.add(n))
        
        // 부족한 번호는 가장 많이 나온 번호 중에서 보충
        while (finalNumbers.size < 6) {
          const remaining = allFrequentNumbers.filter(n => !finalNumbers.has(n))
          if (remaining.length === 0) break
          finalNumbers.add(remaining[0])
        }
        
        // 홀짝 비율 랜덤 선택: 2:4, 3:3, 4:2
        const oddEvenOptions: [number, number][] = [[2, 4], [3, 3], [4, 2]]
        const selectedOddEven = oddEvenOptions[Math.floor(Math.random() * oddEvenOptions.length)]
        
        return generateNumbers('aggressive', {
          includeNumbers: Array.from(finalNumbers).slice(0, 6),
          oddEven: selectedOddEven,
          latestRoundNumbers: latestAll, // 직전 회차 번호 목록 전달
        })
      } else if (input.preset === 'defensive') {
        // 낭만형: 가장 오래 나오지 않은 번호 3개 (직전 회차 번호 포함 가능) + 직전 회차 번호 1개 (이미 있으면 건너뜀) + 궁합 번호 2개 (직전 회차 번호 1개가 이미 있으면 건너뜀) + 부족한 번호는 가장 오래 나오지 않은 번호로 보충
        const allResults = await db
          .select()
          .from(lottoWinResult)
          .orderBy(desc(lottoWinResult.draw_date))
          .limit(1000)
        
        const lastSeenIndex = new Map<number, number>()
        allResults.forEach((result, index) => {
          const nums = (result.numbers as number[]) || []
          nums.forEach((num) => {
            if (!lastSeenIndex.has(num)) {
              lastSeenIndex.set(num, index)
            }
          })
          if (!lastSeenIndex.has(result.bonus)) {
            lastSeenIndex.set(result.bonus, index)
          }
        })
        
        // 직전 회차 번호 목록
        const latestAll = [
          ...((recentResults[0]?.numbers as number[]) || []),
          recentResults[0]?.bonus || 0,
        ].filter(n => n > 0)
        
        // 모든 번호의 lastSeenIndex 계산
        const missingNumbersWithIndex: Array<{ number: number; lastSeenIndex: number }> = []
        for (let i = 1; i <= 45; i++) {
          const lastIndex = lastSeenIndex.get(i)
          missingNumbersWithIndex.push({
            number: i,
            lastSeenIndex: lastIndex ?? allResults.length,
          })
        }
        
        // 가장 오래된 번호 (lastSeenIndex가 큰 순서) - 직전 회차 번호 포함 가능
        missingNumbersWithIndex.sort((a, b) => b.lastSeenIndex - a.lastSeenIndex)
        const allOldestMissing = missingNumbersWithIndex.map(item => item.number)
        const oldestMissing = allOldestMissing.slice(0, 3)
        
        // 직전 회차 번호 1개 추가 (이미 oldestMissing에 포함되어 있으면 건너뜀)
        const finalNumbers = new Set<number>(oldestMissing)
        const latestInOldest = oldestMissing.filter(n => latestAll.includes(n))
        if (latestInOldest.length === 0) {
          // 직전 회차 번호가 oldestMissing에 없으면 추가
          const latestOne = latestAll[Math.floor(Math.random() * latestAll.length)]
          finalNumbers.add(latestOne)
        }
        
        // 가장 오래된 번호의 궁합 번호 찾기
        const topPairs = await db
          .select()
          .from(combinationStats)
          .where(and(eq(combinationStats.type, 'pair'), gte(combinationStats.count, 30)))
          .orderBy(desc(combinationStats.count))
          .limit(100)
        
        const pairCandidates: number[] = []
        const oldestNumber = oldestMissing[0]
        
        // 직전 회차 번호가 이미 포함되어 있는지 확인
        const hasLatest = Array.from(finalNumbers).some(n => latestAll.includes(n))
        
        for (const pair of topPairs) {
          const pairNums = (pair.numbers as number[]) || []
          if (pairNums.length === 2) {
            const [num1, num2] = pairNums
            if (num1 === oldestNumber && !finalNumbers.has(num2)) {
              // 직전 회차 번호가 이미 1개 있으면 건너뜀
              if (hasLatest && latestAll.includes(num2)) continue
              pairCandidates.push(num2)
            } else if (num2 === oldestNumber && !finalNumbers.has(num1)) {
              // 직전 회차 번호가 이미 1개 있으면 건너뜀
              if (hasLatest && latestAll.includes(num1)) continue
              pairCandidates.push(num1)
            }
          }
        }
        
        const selectedPair = pairCandidates
          .filter(n => !finalNumbers.has(n))
          .sort(() => Math.random() - 0.5)
          .slice(0, 2)
        
        selectedPair.forEach(n => finalNumbers.add(n))
        
        // 부족한 번호는 가장 오래 나오지 않은 번호 중에서 보충
        while (finalNumbers.size < 6) {
          const remaining = allOldestMissing.filter(n => !finalNumbers.has(n))
          if (remaining.length === 0) break
          finalNumbers.add(remaining[0])
        }
        
        // 홀짝 비율 랜덤 선택: 2:4, 3:3, 4:2
        const oddEvenOptions: [number, number][] = [[2, 4], [3, 3], [4, 2]]
        const selectedOddEven = oddEvenOptions[Math.floor(Math.random() * oddEvenOptions.length)]
        
        return generateNumbers('defensive', {
          includeNumbers: Array.from(finalNumbers).slice(0, 6),
          oddEven: selectedOddEven,
          latestRoundNumbers: latestAll, // 직전 회차 번호 목록 전달
        })
      }
      
      return []
    }),

  generateCustom: publicProcedure
    .input(
      z.object({
        includeNumbers: z.array(z.number().min(1).max(45)).optional(),
        excludeNumbers: z.array(z.number().min(1).max(45)).optional(),
        oddEven: z.tuple([z.number(), z.number()]).optional(),
        numberRanges: z.array(z.number().min(1).max(5)).optional(),
        sumRange: z.tuple([z.number(), z.number()]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      return generateNumbers('custom', {
        includeNumbers: input.includeNumbers,
        excludeNumbers: input.excludeNumbers,
        oddEven: input.oddEven,
        numberRanges: input.numberRanges,
        sumRange: input.sumRange,
      })
    }),

  getLastSeenRounds: publicProcedure
    .input(z.object({ numbers: z.array(z.number()) }))
    .query(async ({ input }) => {
      const allResults = await db
        .select()
        .from(lottoWinResult)
        .orderBy(desc(lottoWinResult.draw_date))

      const lastSeenMap = new Map<number, number>()
      let latestRoundId: number | null = null

      if (allResults.length > 0) {
        latestRoundId = allResults[0].id
      }

      allResults.forEach((result) => {
        const numbers = (result.numbers as number[]) || []
        numbers.forEach((num) => {
          if (input.numbers.includes(num) && !lastSeenMap.has(num)) {
            lastSeenMap.set(num, result.id)
          }
        })
        if (input.numbers.includes(result.bonus) && !lastSeenMap.has(result.bonus)) {
          lastSeenMap.set(result.bonus, result.id)
        }
      })

      return {
        rounds: Array.from(lastSeenMap.entries()).map(([number, roundId]) => ({
          number,
          roundId,
        })),
        latestRoundId,
      }
    }),

  checkPairNumbers: publicProcedure
    .input(z.object({ numbers: z.array(z.number()) }))
    .query(async ({ input }) => {
      const topPairs = await db
        .select()
        .from(combinationStats)
        .where(and(eq(combinationStats.type, 'pair'), gte(combinationStats.count, 30)))
        .orderBy(desc(combinationStats.count))
        .limit(100)

      const pairMap = new Map<number, number>()

      for (const pair of topPairs) {
        const pairNums = (pair.numbers as number[]) || []
        if (pairNums.length === 2) {
          const [num1, num2] = pairNums
          if (input.numbers.includes(num1) && input.numbers.includes(num2)) {
            if (!pairMap.has(num1)) {
              pairMap.set(num1, num2)
            }
            if (!pairMap.has(num2)) {
              pairMap.set(num2, num1)
            }
          }
        }
      }

      return Array.from(pairMap.entries()).map(([number, pairNumber]) => ({
        number,
        pairNumber,
      }))
    }),
})
