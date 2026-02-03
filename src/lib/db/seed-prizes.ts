/**
 * prizes.json → prizes 테이블 + numbers 테이블
 * prizes: draw_date, count_auto/manual/semi, count_1st~5st, prize_*, sum_prize_*, total_winner_count, total_round_sales
 * numbers: round, numbers[], bonus, odd_even, high_low, sum, sections, end_sum (계산)
 */
import { readFileSync } from 'fs'
import { join } from 'path'
import { db } from './client'
import { prizes, numbers } from './schema'
import { computeAll } from './computeNumbers'
import { eq } from 'drizzle-orm'

type PrizeItem = {
  ltEpsd: number
  ltRflYmd: string
  tm1WnNo: number
  tm2WnNo: number
  tm3WnNo: number
  tm4WnNo: number
  tm5WnNo: number
  tm6WnNo: number
  bnsWnNo: number
  winType1?: number
  winType2?: number
  winType3?: number
  rnk1WnNope: number
  rnk1WnAmt: number
  rnk1SumWnAmt: number
  rnk2WnNope: number
  rnk2WnAmt: number
  rnk2SumWnAmt: number
  rnk3WnNope: number
  rnk3WnAmt: number
  rnk3SumWnAmt: number
  rnk4WnNope: number
  rnk4WnAmt: number
  rnk4SumWnAmt: number
  rnk5WnNope: number
  rnk5WnAmt: number
  rnk5SumWnAmt: number
  sumWnNope: number
  rlvtEpsdSumNtslAmt: number
}

async function seed() {
  const path = join(process.cwd(), 'src/lib/db/data/prizes.json')
  console.log('📖 Reading', path)
  const raw = readFileSync(path, 'utf-8')
  const json = JSON.parse(raw) as { data?: { list?: PrizeItem[] } }
  const list = json.data?.list ?? []
  if (list.length === 0) {
    console.log('No list in JSON')
    process.exit(1)
  }
  console.log('📊 Items to seed:', list.length)

  const batchSize = 100
  for (let i = 0; i < list.length; i += batchSize) {
    const batch = list.slice(i, i + batchSize)
    for (const item of batch) {
      const round = item.ltEpsd
      const numArr = [item.tm1WnNo, item.tm2WnNo, item.tm3WnNo, item.tm4WnNo, item.tm5WnNo, item.tm6WnNo]
      const computed = computeAll(numArr)

      await db
        .insert(prizes)
        .values({
          round,
          draw_date: item.ltRflYmd,
          count_auto: item.winType1 ?? 0,
          count_manual: item.winType2 ?? 0,
          count_semi: item.winType3 ?? 0,
          count_1st: item.rnk1WnNope,
          prize_1st: item.rnk1WnAmt ?? null,
          sum_prize_1st: item.rnk1SumWnAmt ?? null,
          count_2nd: item.rnk2WnNope,
          prize_2nd: item.rnk2WnAmt ?? null,
          sum_prize_2nd: item.rnk2SumWnAmt ?? null,
          count_3rd: item.rnk3WnNope,
          prize_3rd: item.rnk3WnAmt ?? null,
          sum_prize_3rd: item.rnk3SumWnAmt ?? null,
          count_4th: item.rnk4WnNope,
          prize_4th: item.rnk4WnAmt ?? null,
          sum_prize_4th: item.rnk4SumWnAmt ?? null,
          count_5st: item.rnk5WnNope,
          prize_5st: item.rnk5WnAmt ?? null,
          sum_prize_5st: item.rnk5SumWnAmt ?? null,
          total_winner_count: item.sumWnNope ?? null,
          total_round_sales: item.rlvtEpsdSumNtslAmt ?? null,
        })
        .onConflictDoUpdate({
          target: prizes.round,
          set: {
            draw_date: item.ltRflYmd,
            count_auto: item.winType1 ?? 0,
            count_manual: item.winType2 ?? 0,
            count_semi: item.winType3 ?? 0,
            count_1st: item.rnk1WnNope,
            prize_1st: item.rnk1WnAmt ?? null,
            sum_prize_1st: item.rnk1SumWnAmt ?? null,
            count_2nd: item.rnk2WnNope,
            prize_2nd: item.rnk2WnAmt ?? null,
            sum_prize_2nd: item.rnk2SumWnAmt ?? null,
            count_3rd: item.rnk3WnNope,
            prize_3rd: item.rnk3WnAmt ?? null,
            sum_prize_3rd: item.rnk3SumWnAmt ?? null,
            count_4th: item.rnk4WnNope,
            prize_4th: item.rnk4WnAmt ?? null,
            sum_prize_4th: item.rnk4SumWnAmt ?? null,
            count_5st: item.rnk5WnNope,
            prize_5st: item.rnk5WnAmt ?? null,
            sum_prize_5st: item.rnk5SumWnAmt ?? null,
            total_winner_count: item.sumWnNope ?? null,
            total_round_sales: item.rlvtEpsdSumNtslAmt ?? null,
          },
        })

      await db
        .insert(numbers)
        .values({
          round,
          numbers: numArr,
          bonus: item.bnsWnNo,
          odd_even: computed.odd_even,
          high_low: computed.high_low,
          sum: computed.sum,
          sections: computed.sections,
          end_sum: computed.end_sum,
        })
        .onConflictDoUpdate({
          target: numbers.round,
          set: {
            numbers: numArr,
            bonus: item.bnsWnNo,
            odd_even: computed.odd_even,
            high_low: computed.high_low,
            sum: computed.sum,
            sections: computed.sections,
            end_sum: computed.end_sum,
          },
        })
    }
    console.log('   Processed', Math.min(i + batchSize, list.length), '/', list.length)
  }
  console.log('✨ Prizes + Numbers seed complete')
  process.exit(0)
}

seed().catch((e) => {
  console.error(e)
  process.exit(1)
})
