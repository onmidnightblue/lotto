import { pgTable, serial, integer, bigint, text, json, timestamp, doublePrecision, primaryKey } from 'drizzle-orm/pg-core'

// ========== prizes (prizes.json) ==========
// round, draw_date, count_auto/manual/semi, count_1st~5st, prize_1st~5st, sum_prize_1st~5st, total_winner_count, total_round_sales
export const prizes = pgTable('prizes', {
  round: integer('round').primaryKey(),
  draw_date: text('draw_date').notNull(),
  count_auto: integer('count_auto').default(0),
  count_manual: integer('count_manual').default(0),
  count_semi: integer('count_semi').default(0),
  count_1st: integer('count_1st').default(0),
  prize_1st: bigint('prize_1st', { mode: 'number' }),
  sum_prize_1st: bigint('sum_prize_1st', { mode: 'number' }),
  count_2nd: integer('count_2nd').default(0),
  prize_2nd: bigint('prize_2nd', { mode: 'number' }),
  sum_prize_2nd: bigint('sum_prize_2nd', { mode: 'number' }),
  count_3rd: integer('count_3rd').default(0),
  prize_3rd: bigint('prize_3rd', { mode: 'number' }),
  sum_prize_3rd: bigint('sum_prize_3rd', { mode: 'number' }),
  count_4th: integer('count_4th').default(0),
  prize_4th: bigint('prize_4th', { mode: 'number' }),
  sum_prize_4th: bigint('sum_prize_4th', { mode: 'number' }),
  count_5st: integer('count_5st').default(0),
  prize_5st: bigint('prize_5st', { mode: 'number' }),
  sum_prize_5st: bigint('sum_prize_5st', { mode: 'number' }),
  total_winner_count: integer('total_winner_count'),
  total_round_sales: bigint('total_round_sales', { mode: 'number' }),
})

// ========== numbers (from prizes.json: ltEpsd, tm1~6WnNo, bnsWnNo + 계산) ==========
// round, numbers[], bonus, odd_even, high_low, sum, sections, end_sum
export const numbers = pgTable('numbers', {
  round: integer('round')
    .primaryKey()
    .references(() => prizes.round),
  numbers: json('numbers').$type<number[]>().notNull(),
  bonus: integer('bonus').notNull(),
  odd_even: json('odd_even').$type<{ odd: number; even: number }>(),
  high_low: json('high_low').$type<{ high: number; low: number }>(),
  sum: integer('sum'),
  sections: json('sections').$type<Record<string, number>>(), // e.g. {"10": 2, "20": 1, "30": 3}
  end_sum: integer('end_sum'), // 끝수 합 (일의 자리 합)
})

// ========== stores (stores.csv) ==========
// PK = (round, rnum)
export const stores = pgTable(
  'stores',
  {
    round: integer('round')
      .notNull()
      .references(() => prizes.round),
    rnum: integer('rnum').notNull(),
    store_name: text('store_name').notNull(),
    store_tel: text('store_tel'),
    region: text('region'),
    address_part1: text('address_part1'),
    address_part2: text('address_part2'),
    address_part3: text('address_part3'),
    address_part4: text('address_part4'),
    full_address: text('full_address'),
    auto_win_type: text('auto_win_type'),
    store_id: text('store_id'),
    store_status: text('store_status'),
    sell_lotto: text('sell_lotto'),
    rank: integer('rank').default(1),
    latitude: doublePrecision('latitude'),
    longitude: doublePrecision('longitude'),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.round, table.rnum] }),
  })
)

// ========== 기존 테이블 (분석/조합 등) ==========
export const analysisResult = pgTable('analysis_result', {
  id: serial('id').primaryKey(),
  analysis_type: text('analysis_type').notNull(),
  result: json('result').$type<{
    triple?: Array<{ combination: number[]; count: number }>
    quadruple?: Array<{ combination: number[]; count: number }>
    pair?: Array<{ combination: number[]; count: number; type: 'affinity' | 'conflict' }>
  }>(),
  meta: json('meta').$type<Record<string, any>>().default({}),
  created_at: timestamp('created_at').defaultNow(),
})

export const userActivityLog = pgTable('user_activity_log', {
  id: serial('id').primaryKey(),
  user_id: text('user_id'),
  action: text('action').notNull(),
  payload: json('payload').$type<Record<string, any>>().default({}),
  created_at: timestamp('created_at').defaultNow(),
})

export const combinationStats = pgTable('combination_stats', {
  id: serial('id').primaryKey(),
  type: text('type').notNull(),
  numbers: json('numbers').$type<number[]>().notNull(),
  count: integer('count').notNull(),
  rank: integer('rank').notNull(),
  rounds: json('rounds').$type<number[]>(),
  created_at: timestamp('created_at').defaultNow(),
})

