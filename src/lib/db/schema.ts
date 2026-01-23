import { pgTable, serial, integer, bigint, text, json, timestamp } from 'drizzle-orm/pg-core'

// LottoWinResult: stores each draw
export const lottoWinResult = pgTable('lotto_win_result', {
  id: serial('id').primaryKey(),
  draw_date: timestamp('draw_date').notNull(),
  numbers: json('numbers').$type<number[]>(),
  bonus: integer('bonus').notNull(),
  prize_amount: bigint('prize_amount', { mode: 'number' }), // 1등 당첨 금액 (원 단위)
  winner_count: integer('winner_count'), // 당첨자 수
  odd_even: json('odd_even').$type<{ odd: number; even: number }>(), // 홀짝 분포
  high_low: json('high_low').$type<{ high: number; low: number }>(), // 고저 분포 (23 이상/미만)
  total_sum: integer('total_sum'), // 총합
  created_at: timestamp('created_at').defaultNow(),
})

// AnalysisResult: stores generated analysis results (JSON)
export const analysisResult = pgTable('analysis_result', {
  id: serial('id').primaryKey(),
  analysis_type: text('analysis_type').notNull(), // 'combination' (동반/궁합/원수)
  result: json('result').$type<{
    triple?: Array<{ combination: number[]; count: number }>
    quadruple?: Array<{ combination: number[]; count: number }>
    pair?: Array<{ combination: number[]; count: number; type: 'affinity' | 'conflict' }>
  }>(),
  meta: json('meta').$type<Record<string, any>>().default({}),
  created_at: timestamp('created_at').defaultNow(),
})

// UserActivityLog: simple audit log
export const userActivityLog = pgTable('user_activity_log', {
  id: serial('id').primaryKey(),
  user_id: text('user_id'),
  action: text('action').notNull(),
  payload: json('payload').$type<Record<string, any>>().default({}),
  created_at: timestamp('created_at').defaultNow(),
})

// CombinationStats: stores pre-calculated combination statistics
export const combinationStats = pgTable('combination_stats', {
  id: serial('id').primaryKey(),
  type: text('type').notNull(), // 'triple', 'quadruple', 'pair-affinity', 'pair-conflict'
  numbers: json('numbers').$type<number[]>().notNull(), // 조합 번호 배열
  count: integer('count').notNull(), // 출현 횟수
  rank: integer('rank').notNull(), // 순위 (1부터 시작)
  rounds: json('rounds').$type<number[]>(), // 해당 조합이 나온 회차 ID 배열
  created_at: timestamp('created_at').defaultNow(),
})
