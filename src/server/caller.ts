import { appRouter } from './index'

export async function createServerCaller(opts?: { req?: any; res?: any }) {
  const ctx = {}
  return appRouter.createCaller(ctx)
}
