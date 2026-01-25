import { router } from './trpc'
import { lottoRouter } from './routers/lotto'
import { analysisRouter } from './routers/analysis'
import { generatorRouter } from './routers/generator'
import { adminRouter } from './routers/admin'

export const appRouter = router({
  lotto: lottoRouter,
  analysis: analysisRouter,
  generator: generatorRouter,
  admin: adminRouter,
})

export type AppRouter = typeof appRouter
