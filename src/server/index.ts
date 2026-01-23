import { router } from './trpc'
import { lottoRouter } from './routers/lotto'
import { analysisRouter } from './routers/analysis'
import { generatorRouter } from './routers/generator'

export const appRouter = router({
  lotto: lottoRouter,
  analysis: analysisRouter,
  generator: generatorRouter,
})

export type AppRouter = typeof appRouter
