/**
 * 소스 파일 스키마: prizes.json → prizes + numbers 테이블, stores.csv → stores 테이블
 */

// ========== prizes.json ==========
// [prizes 테이블] ltEpsd→round, ltRflYmd→draw_date, winType1→count_auto, winType2→count_manual, winType3→count_semi
// rnk1~5 → count_1st~5st, prize_1st~5st, sum_prize_1st~5st, sumWnNope→total_winner_count, rlvtEpsdSumNtslAmt→total_round_sales
// [numbers 테이블] ltEpsd→round, tm1~6WnNo→numbers[], bnsWnNo→bonus + 계산: odd_even, high_low, sum, sections, end_sum

export interface LottoPrizesJsonItem {
  winType0: number
  winType1: number
  winType2: number
  winType3: number
  gmSqNo: number
  ltEpsd: number              // → draw_no (id)
  tm1WnNo: number              // → numbers[0]
  tm2WnNo: number
  tm3WnNo: number
  tm4WnNo: number
  tm5WnNo: number
  tm6WnNo: number
  bnsWnNo: number              // → bonus
  ltRflYmd: string             // → draw_date (YYYYMMDD)
  rnk1WnNope: number           // → win1_count
  rnk1WnAmt: number            // → win1_amount
  rnk1SumWnAmt: number         // → win1_totalAmount
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
  rnk5SumWnAmt: number         // → win5_totalAmount
  rlvtEpsdSumNtslAmt?: number  // → roundSalesAmount
  sumWnNope?: number
  wholEpsdSumNtslAmt?: number
  excelRnk?: string
}

export interface LottoPrizesJsonRoot {
  resultCode: number | null
  resultMessage: string | null
  data: { list: LottoPrizesJsonItem[] }
}

// ========== lotto_stores.csv ==========
// DB 저장 키: shpNm→store_name, shpTelno→store_tel, tm1~4ShpLctnAddr→address_part1~4,
// shpAddr→full_address, atmtPsvYnTxt→auto_win_type, ltShpId→store_id, slrOperSttsCd→store_status,
// l645LtNtslYn→sell_lotto, wnShpRnk→rank, shpLat→latitude, shpLot→longitude, round

export interface LottoStoresCsvRow {
  rnum: string
  shpNm: string           // → store_name
  shpTelno: string        // → store_tel
  region: string
  tm1ShpLctnAddr: string  // → address_part1
  tm2ShpLctnAddr: string  // → address_part2
  tm3ShpLctnAddr: string  // → address_part3
  tm4ShpLctnAddr: string  // → address_part4
  shpAddr: string         // → full_address
  atmtPsvYn: string
  atmtPsvYnTxt: string    // → auto_win_type
  ltShpId: string         // → store_id
  slrOperSttsCd: string   // → store_status
  l645LtNtslYn: string    // → sell_lotto
  st5LtNtslYn: string
  st10LtNtslYn: string
  st20LtNtslYn: string
  pt720NtslYn: string
  wnShpRnk: string        // → rank (1|2)
  shpLat: string          // → latitude
  shpLot: string          // → longitude
  round: string
}

export const LOTTO_STORES_CSV_HEADERS = [
  'rnum', 'shpNm', 'shpTelno', 'region',
  'tm1ShpLctnAddr', 'tm2ShpLctnAddr', 'tm3ShpLctnAddr', 'tm4ShpLctnAddr',
  'shpAddr', 'atmtPsvYn', 'atmtPsvYnTxt', 'ltShpId', 'slrOperSttsCd',
  'l645LtNtslYn', 'st5LtNtslYn', 'st10LtNtslYn', 'st20LtNtslYn', 'pt720NtslYn',
  'wnShpRnk', 'shpLat', 'shpLot', 'round',
] as const
