import { pgTable, serial, integer, text, json, timestamp } from 'drizzle-orm/pg-core'

// LottoWinResult: stores each draw
export const lottoWinResult = pgTable('lotto_win_result', {
  id: serial('id').primaryKey(),
  draw_date: timestamp('draw_date').notNull(),
  numbers: json('numbers').$type<number[]>(),
  bonus: integer('bonus').notNull(),
  created_at: timestamp('created_at').defaultNow(),
})

// AnalysisResult: stores generated analysis results (JSON)
export const analysisResult = pgTable('analysis_result', {
  id: serial('id').primaryKey(),
  analysis_type: text('analysis_type').notNull(),
  result: json('result').$type<Record<string, any>>(),
  meta: json('meta').$type<Record<string, any>>().default('{}'),
  created_at: timestamp('created_at').defaultNow(),
})

// UserActivityLog: simple audit log
export const userActivityLog = pgTable('user_activity_log', {
  id: serial('id').primaryKey(),
  user_id: text('user_id'),
  action: text('action').notNull(),
  payload: json('payload').$Type<Record<string, any>>().default('{}'),
  created_at: timestamp('created_at').defaultNow(),
})
