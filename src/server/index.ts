import { router } from './trpc'
import { lottoRouter } from './routers/lotto'
import { analysisRouter } from './routers/analysis'

export const appRouter = router({
  lotto: lottoRouter,
  analysis: analysisRouter,
})

export type AppRouter = typeof appRouter
