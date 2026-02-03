import { router } from './trpc'
import { lottoRouter } from './routers/lotto'
import { analysisRouter } from './routers/analysis'
import { generatorRouter } from './routers/generator'
import { storesRouter } from './routers/stores'

export const appRouter = router({
  lotto: lottoRouter,
  analysis: analysisRouter,
  generator: generatorRouter,
  stores: storesRouter,
})

export type AppRouter = typeof appRouter
