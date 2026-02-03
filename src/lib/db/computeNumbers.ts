/**
 * numbers 테이블용 계산: odd_even, high_low, sum, sections, end_sum
 */
export function computeOddEven(nums: number[]): { odd: number; even: number } {
  let odd = 0
  let even = 0
  for (const n of nums) {
    if (n % 2 === 1) odd++
    else even++
  }
  return { odd, even }
}

/** 23 이상 = high, 미만 = low */
export function computeHighLow(nums: number[]): { high: number; low: number } {
  let high = 0
  let low = 0
  for (const n of nums) {
    if (n >= 23) high++
    else low++
  }
  return { high, low }
}

export function computeSum(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0)
}

/** 구간: 1-10→"10", 11-20→"20", 21-30→"30", 31-40→"40", 41-45→"45" */
export function computeSections(nums: number[]): Record<string, number> {
  const sections: Record<string, number> = { '10': 0, '20': 0, '30': 0, '40': 0, '45': 0 }
  for (const n of nums) {
    if (n <= 10) sections['10']++
    else if (n <= 20) sections['20']++
    else if (n <= 30) sections['30']++
    else if (n <= 40) sections['40']++
    else sections['45']++
  }
  return sections
}

/** 끝수 합 (일의 자리 합) */
export function computeEndSum(nums: number[]): number {
  return nums.reduce((a, b) => a + (b % 10), 0)
}

export function computeAll(nums: number[]) {
  return {
    odd_even: computeOddEven(nums),
    high_low: computeHighLow(nums),
    sum: computeSum(nums),
    sections: computeSections(nums),
    end_sum: computeEndSum(nums),
  }
}
