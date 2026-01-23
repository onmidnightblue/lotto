import { initTRPC } from '@trpc/server'
import { z } from 'zod'

const t = initTRPC.context<{ user?: { id: string } | null }>().create()

export const router = t.router
export const publicProcedure = t.procedure
