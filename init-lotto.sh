```bash name=init-project.sh
#!/usr/bin/env bash
set -euo pipefail

# init-project.sh
# Usage: ./init-project.sh
# Creates the complete project folder structure and files for the Lotto Analysis scaffold.
# This will overwrite files with the same paths in the current directory.
#
# Run in your repository root (on the feature/init-lotto-architecture branch) and then:
#   git add .
#   git commit -m "chore: init Lotto Analysis architecture"
#   git push origin feature/init-lotto-architecture

echo "Initializing Lotto Analysis project files..."

# Create directories
mkdir -p src/app/analysis src/app/simulation src/app/generator src/app/api/trpc
mkdir -p src/components/analysis src/components/generator src/components/simulation src/components/ui
mkdir -p src/lib/db src/lib/schema src/mock src/server/routers src/styles src/components/analysis/__tests__
mkdir -p .github/workflows

# Helper to write files with preserved content
write_file() {
  local path="$1"
  local content="$2"
  echo "Writing $path"
  mkdir -p "$(dirname "$path")"
  cat > "$path" <<'EOF'
'"$content"'
EOF
  # Remove the placeholder wrapping (we inserted the content as a literal single-quoted string).
  # Replace the single-quoted wrapper lines to restore original content.
  # (This approach ensures special characters are preserved.)
  sed -n '1!p' "$path" | sed '1s/^'"'"'//; $s/'"'"'$//' > "$path.tmp" || true
  mv "$path.tmp" "$path"
}

# Due to complexities with nested quoting, we'll create each file using here-documents directly.

cat > package.json <<'EOF'
{
  "name": "lotto",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "typecheck": "tsc --noEmit",
    "lint": "biome check",
    "format": "biome format",
    "format:check": "biome format --check",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "drizzle:generate": "drizzle-kit generate:pg",
    "drizzle:push": "drizzle-kit push"
  },
  "engines": {
    "node": ">=18"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.0.0",
    "@tanstack/react-query": "^4.0.0",
    "@trpc/client": "^11.0.0",
    "@trpc/react-query": "^11.0.0",
    "@trpc/server": "^11.0.0",
    "drizzle-orm": "^0.22.0",
    "drizzle-kit": "^0.3.0",
    "drizzle-zod": "^0.1.0",
    "next": "14",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "slonik": "^27.0.0",
    "pg": "^8.0.0",
    "supabase-js": "^2.0.0",
    "tailwindcss": "^3.0.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^5.17.0",
    "@testing-library/react": "^14.0.0",
    "@types/node": "20.0.0",
    "@types/react": "18.2.0",
    "@types/react-dom": "18.2.0",
    "biome": "^1.0.0",
    "postcss": "^8.0.0",
    "autoprefixer": "^10.0.0",
    "typescript": "^5.0.0",
    "vitest": "^0.34.0",
    "vite-tsconfig-paths": "^4.0.0"
  }
}
EOF

cat > .env.example <<'EOF'
# Supabase / Database placeholders
# Replace these with your project's values (do NOT commit production secrets to version control).

# Supabase (JS client) - useful for auth, storage, realtime
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=anon-key-placeholder

# Postgres connection string used by Drizzle (server-side).
DATABASE_URL=postgres://postgres:password@db.your-supabase-host:5432/postgres

# Optional service role (if separate)
SUPABASE_SERVICE_ROLE_KEY=service-role-key-placeholder

# Next.js settings
NEXTAUTH_URL=http://localhost:3000
EOF

cat > tsconfig.json <<'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["DOM", "ES2022"],
    "jsx": "react-jsx",
    "module": "ESNext",
    "moduleResolution": "Node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "baseUrl": "src",
    "paths": {
      "@/*": ["*"]
    },
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  },
  "include": ["src"]
}
EOF

cat > next.config.js <<'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    appDir: true
  }
}
module.exports = nextConfig
EOF

cat > postcss.config.cjs <<'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

cat > tailwind.config.cjs <<'EOF'
module.exports = {
  content: ['./src/**/*.{ts,tsx,js,jsx,mdx}'],
  theme: { extend: {} },
  plugins: [],
}
EOF

cat > biome.json <<'EOF'
{
  "format": {
    "enabled": true
  },
  "lint": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "language": {
    "javascript": { "enabled": true },
    "typescript": { "enabled": true }
  }
}
EOF

cat > vitest.config.ts <<'EOF'
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    globals: true
  }
})
EOF

cat > drizzle.config.ts <<'EOF'
import type { Config } from 'drizzle-kit'
export default {
  schema: './src/lib/db/schema.ts',
  out: './drizzle'
} satisfies Config
EOF

# App layout and pages
cat > src/app/layout.tsx <<'EOF'
import './styles/globals.css'
import TrpcProvider from '@/components/TrpcProvider'

export const metadata = {
  title: 'Lotto Analysis',
  description: 'Lotto Analysis & Simulation Platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-slate-900">
        <main className="max-w-6xl mx-auto p-6">
          <TrpcProvider>{children}</TrpcProvider>
        </main>
      </body>
    </html>
  )
}
EOF

cat > src/app/page.tsx <<'EOF'
export default function Home() {
  return (
    <div>
      <h1 className="text-3xl font-bold">Lotto Analysis & Simulation</h1>
      <p className="mt-2 text-slate-600">Choose analysis, simulation or generator from the routes.</p>
    </div>
  )
}
EOF

cat > src/app/analysis/page.tsx <<'EOF'
import React from 'react'
import ServerAnalysis from './server-analysis'
import MissingRangeClient from '@/components/analysis/MissingRangeClient'

export const metadata = {
  title: 'Analysis · Lotto Analysis',
  description: 'Server and client analysis views for Lotto Analysis platform',
}

export default async function AnalysisPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold">Analysis</h1>
        <p className="text-slate-600 mt-1">Server-rendered and client interactive analysis.</p>
      </header>

      <section>
        <ServerAnalysis weeks={3} />
      </section>

      <section>
        <h2 className="text-xl font-semibold">Interactive (Client)</h2>
        <div className="mt-4">
          <MissingRangeClient weeks={3} />
        </div>
      </section>
    </div>
  )
}
EOF

cat > src/app/analysis/server-analysis.tsx <<'EOF'
import React from 'react'
import { createServerCaller } from '@/server/caller'

export default async function ServerAnalysis({ weeks = 3 }: { weeks?: number }) {
  const caller = await createServerCaller()
  const missing = await caller.analysis.missingRange({ weeks })

  return (
    <div>
      <h2 className="text-2xl font-semibold">Server Analysis (Missing Range)</h2>
      <div className="mt-4">
        {missing.length === 0 ? (
          <div className="p-3 bg-yellow-50 rounded">No missing numbers for {weeks} draws or more.</div>
        ) : (
          <ul className="space-y-2">
            {missing.slice(0, 50).map((m: any) => (
              <li key={m.number} className="flex items-center justify-between border-b pb-2">
                <div className="text-slate-700">#{String(m.number).padStart(2, '0')}</div>
                <div className="text-slate-500 text-sm">{m.missingCount} draws</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
EOF

cat > src/app/simulation/page.tsx <<'EOF'
import SimulationView from '@/components/simulation/SimulationView'

export default function SimulationPage() {
  return <SimulationView />
}
EOF

cat > src/app/generator/page.tsx <<'EOF'
import GeneratorView from '@/components/generator/GeneratorView'

export default function GeneratorPage() {
  return <GeneratorView />
}
EOF

# DB schema & client
cat > src/lib/db/schema.ts <<'EOF'
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
EOF

cat > src/lib/db/client.ts <<'EOF'
/**
 * Supabase/Postgres + Drizzle client
 *
 * - Reads DATABASE_URL from env (recommended for server-side only)
 * - Exports `db` (Drizzle) and `pgPool` (node-postgres Pool) for migrations/tools
 */

import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'

const connectionString =
  process.env.DATABASE_URL ||
  process.env.SUPABASE_DB_URL ||
  ''

if (!connectionString) {
  throw new Error(
    'DATABASE_URL not set. Set DATABASE_URL to your Supabase Postgres connection string.'
  )
}

const pool = new Pool({
  connectionString,
})

export const pgPool = pool
export const db = drizzle(pgPool)

export type PgPool = typeof pgPool

export default db
EOF

cat > src/lib/db/index.ts <<'EOF'
export { db, pgPool } from './client'
export * from './schema'
EOF

cat > src/lib/schema/index.ts <<'EOF'
import { z } from 'zod'
import { buildJsonSchema } from 'drizzle-zod'
import * as db from '@/lib/db/schema'

export const LottoWinResultSchema = buildJsonSchema(db.lottoWinResult)
export const AnalysisResultSchema = buildJsonSchema(db.analysisResult)
export const UserActivityLogSchema = buildJsonSchema(db.userActivityLog)

export type LottoWinResult = z.infer<typeof LottoWinResultSchema>
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>
export type UserActivityLog = z.infer<typeof UserActivityLogSchema>
EOF

cat > src/lib/types.ts <<'EOF'
export type Draw = { draw_date: string; numbers: number[]; bonus: number }
EOF

# Mock data
cat > src/mock/lottoHistory.ts <<'EOF'
/**
 * Programmatic mock: generates deterministic 2,200 weekly draws.
 * Each draw has 6 unique numbers from 1..45 and a bonus number.
 */

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const RNG = mulberry32(1337)
const makeDraw = (dateMs: number) => {
  const set = new Set<number>()
  while (set.size < 6) {
    const n = Math.floor(RNG() * 45) + 1
    set.add(n)
  }
  const numbers = Array.from(set).sort((a, b) => a - b)
  let bonus
  do {
    bonus = Math.floor(RNG() * 45) + 1
  } while (set.has(bonus))
  return {
    draw_date: new Date(dateMs).toISOString(),
    numbers,
    bonus,
  }
}

const rounds = 2200
const weekMs = 7 * 24 * 3600 * 1000
const now = Date.now()
const history = Array.from({ length: rounds }).map((_, i) => {
  return makeDraw(now - i * weekMs)
})

export default history
EOF

# Core logic
cat > src/lib/analysis.ts <<'EOF'
type Draw = { draw_date: string; numbers: number[]; bonus: number }

export function analyzeMissingRange(history: Draw[], minMissingDraws = 3) {
  const lastSeenIndex = new Map<number, number>()
  for (let i = 0; i < history.length; i++) {
    const draw = history[i]
    for (const n of draw.numbers) {
      if (!lastSeenIndex.has(n)) lastSeenIndex.set(n, i)
    }
    if (!lastSeenIndex.has(draw.bonus)) lastSeenIndex.set(draw.bonus, i)
  }
  const results: { number: number; missingCount: number }[] = []
  for (let n = 1; n <= 45; n++) {
    const idx = lastSeenIndex.has(n) ? lastSeenIndex.get(n)! : history.length
    if (idx >= minMissingDraws) results.push({ number: n, missingCount: idx })
  }
  results.sort((a, b) => b.missingCount - a.missingCount)
  return results
}

export function analyzeCooccurrence(history: Draw[], threshold = 3) {
  const pairCounts = new Map<string, number>()
  const tripleCounts = new Map<string, number>()

  for (const draw of history) {
    const nums = draw.numbers
    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        const key = [nums[i], nums[j]].sort((a, b) => a - b).join(',')
        pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1)
      }
    }
    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        for (let k = j + 1; k < nums.length; k++) {
          const key = [nums[i], nums[j], nums[k]].sort((a, b) => a - b).join(',')
          tripleCounts.set(key, (tripleCounts.get(key) ?? 0) + 1)
        }
      }
    }
  }

  const pairs = Array.from(pairCounts.entries())
    .filter(([, v]) => v >= threshold)
    .map(([k, v]) => ({ numbers: k.split(',').map(Number), count: v }))
    .sort((a, b) => b.count - a.count)

  const triples = Array.from(tripleCounts.entries())
    .filter(([, v]) => v >= Math.max(2, threshold - 1))
    .map(([k, v]) => ({ numbers: k.split(',').map(Number), count: v }))
    .sort((a, b) => b.count - a.count)

  return { pairs, triples }
}

export function analyzeConsecutive(history: Draw[]) {
  const seenNext = new Map<number, { count: number; follow: number }>()
  for (let i = 0; i < history.length - 1; i++) {
    const current = new Set(history[i].numbers.concat(history[i].bonus))
    const next = new Set(history[i + 1].numbers.concat(history[i + 1].bonus))
    for (const n of current) {
      const state = seenNext.get(n) ?? { count: 0, follow: 0 }
      state.count += 1
      if (next.has(n)) state.follow += 1
      seenNext.set(n, state)
    }
  }
  const results: { number: number; probability: number; seen: number }[] = []
  for (let n = 1; n <= 45; n++) {
    const s = seenNext.get(n)
    if (s) {
      results.push({ number: n, probability: s.follow / s.count, seen: s.count })
    } else {
      results.push({ number: n, probability: 0, seen: 0 })
    }
  }
  results.sort((a, b) => b.probability - a.probability)
  return results
}
EOF

cat > src/lib/simulation.ts <<'EOF'
type Draw = { draw_date: string; numbers: number[]; bonus: number }
type BacktestOptions = { years?: number; costPerTicket?: number }

export function runBacktest(history: Draw[], opts: BacktestOptions = {}) {
  const years = opts.years ?? 10
  const costPerTicket = opts.costPerTicket ?? 1
  const weeks = years * 52
  const draws = history.slice(0, weeks)
  if (draws.length === 0) return { error: 'no history' }

  const prizeTable: Record<number, number> = {
    6: 2000000,
    5: 50000,
    4: 200,
    3: 10,
    2: 0,
    1: 0,
    0: 0,
  }

  let totalCost = 0
  let totalReturn = 0

  for (const draw of draws) {
    totalCost += costPerTicket
    const ticket = randomTicket()
    const matchCount = ticket.filter((n) => draw.numbers.includes(n)).length
    totalReturn += prizeTable[matchCount] ?? 0
  }

  const roi = ((totalReturn - totalCost) / Math.max(totalCost, 1)) * 100
  const label = roiToLabel(roi)
  return {
    years,
    totalCost,
    totalReturn,
    roi: Number(roi.toFixed(2)),
    label,
    drawsUsed: draws.length,
  }
}

function randomTicket() {
  const set = new Set<number>()
  while (set.size < 6) {
    set.add(Math.floor(Math.random() * 45) + 1)
  }
  return Array.from(set)
}

function roiToLabel(roi: number) {
  if (roi <= -90) return '-90% National Finance Supporter'
  if (roi <= -50) return '-50% Heavy Loss'
  if (roi <= -10) return '-10% Small Loss'
  if (roi < 0) return 'Slight Loss'
  if (roi >= 0 && roi < 10) return 'Break-even-ish'
  if (roi >= 10 && roi < 100) return 'Positive Return'
  return 'Windfall'
}
EOF

cat > src/lib/generator.ts <<'EOF'
type Pick = number[]

export function generateWithFilters(opts: { preset?: 'balanced'|'aggressive'|'conservative', sumRange?: [number, number], oddEven?: [number, number], limit?: number } = {}) {
  const preset = opts.preset ?? 'balanced'
  const sumRange = opts.sumRange ?? [100, 200]
  const oddEven = opts.oddEven ?? (preset === 'balanced' ? [3,3] : preset === 'aggressive' ? [4,2] : [2,4])
  const limit = opts.limit ?? 200

  const results: Pick[] = []
  const rng = () => Math.random()

  const attemptsLimit = 100000
  let attempts = 0
  while (results.length < limit && attempts < attemptsLimit) {
    attempts++
    const set = new Set<number>()
    while (set.size < 6) set.add(Math.floor(rng() * 45) + 1)
    const pick = Array.from(set).sort((a, b) => a - b)
    const s = pick.reduce((a, b) => a + b, 0)
    const odd = pick.filter((n) => n % 2 === 1).length
    const even = 6 - odd
    if (s < sumRange[0] || s > sumRange[1]) continue
    if (odd !== oddEven[0] || even !== oddEven[1]) continue
    results.push(pick)
  }

  return results
}

export const presets = {
  balanced: { oddEven: [3, 3], sumRange: [130, 170] },
  aggressive: { oddEven: [4, 2], sumRange: [100, 220] },
  conservative: { oddEven: [2, 4], sumRange: [120, 200] }
}
EOF

# Server (tRPC + context + routers)
cat > src/server/context.ts <<'EOF'
import type { IncomingMessage, ServerResponse } from 'http'
import type { User } from '@supabase/supabase-js'

export type CreateContextOptions = {
  req?: Request | IncomingMessage | { headers?: any; cookies?: any }
  res?: ServerResponse | any
}

export type Context = {
  req?: CreateContextOptions['req']
  res?: CreateContextOptions['res']
  supabase: any
  user: User | null
}

export async function createContext({ req, res }: CreateContextOptions = {}): Promise<Context> {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
    throw new Error('Missing Supabase env vars NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  const ssrPkg = await import('@supabase/ssr').catch(() => null)
  if (!ssrPkg) {
    throw new Error(
      'Could not import @supabase/ssr. Please install @supabase/ssr (or the appropriate Supabase SSR helpers) and try again.'
    )
  }

  const factory =
    ssrPkg.createServerSupabaseClient ??
    ssrPkg.createServerComponentClient ??
    ssrPkg.createServerClient ??
    ssrPkg.createRouteHandlerClient ??
    ssrPkg.createServerSideSupabaseClient ??
    null

  if (!factory) {
    throw new Error(
      'Could not find a Supabase server factory function in @supabase/ssr. Check the installed package exports.'
    )
  }

  const createArgs: Record<string, any> = {
    supabaseUrl: SUPABASE_URL,
    supabaseKey: SUPABASE_SERVICE_ROLE,
  }

  if (req) createArgs.req = req
  if (res) createArgs.res = res

  // @ts-ignore
  const supabase = factory(createArgs)

  let user: User | null = null
  try {
    if (typeof supabase.auth?.getUser === 'function') {
      const maybe = await supabase.auth.getUser()
      if (maybe?.data?.user) user = maybe.data.user
      else if (maybe?.user) user = maybe.user
    }

    if (!user && typeof supabase.auth?.getSession === 'function') {
      const sessionRes = await supabase.auth.getSession()
      if (sessionRes?.data?.session?.user) user = sessionRes.data.session.user
    }

    if (!user && typeof supabase.auth?.user === 'function') {
      // @ts-ignore
      user = await supabase.auth.user()
    }
  } catch {
    user = null
  }

  return {
    req,
    res,
    supabase,
    user,
  }
}
EOF

cat > src/server/caller.ts <<'EOF'
import { appRouter } from './routers'
import { createContext } from './context'

export async function createServerCaller(opts?: { req?: any; res?: any }) {
  const ctx = await createContext(opts ?? {})
  return appRouter.createCaller(ctx)
}
EOF

cat > src/server/trpc.ts <<'EOF'
import { initTRPC } from '@trpc/server'
import type { Context } from './context'

const t = initTRPC.context<Context>().create()
export const router = t.router
export const publicProcedure = t.procedure
EOF

cat > src/server/routers/analysis.ts <<'EOF'
import { z } from 'zod'
import { publicProcedure, router } from '../trpc'
import history from '@/mock/lottoHistory'
import { analyzeMissingRange, analyzeCooccurrence, analyzeConsecutive } from '@/lib/analysis'

export const analysisRouter = router({
  missingRange: publicProcedure
    .input(z.object({ weeks: z.number().optional() }))
    .query(({ input }) => analyzeMissingRange(history, input.weeks ?? 3)),
  cooccurrence: publicProcedure
    .input(z.object({ threshold: z.number().optional() }))
    .query(({ input }) => analyzeCooccurrence(history, input.threshold ?? 3)),
  consecutive: publicProcedure.query(() => analyzeConsecutive(history)),
})
EOF

cat > src/server/routers/simulation.ts <<'EOF'
import { z } from 'zod'
import { publicProcedure, router } from '../trpc'
import history from '@/mock/lottoHistory'
import { runBacktest } from '@/lib/simulation'

export const simulationRouter = router({
  backtest: publicProcedure
    .input(z.object({ years: z.number().optional(), costPerTicket: z.number().optional() }))
    .query(({ input }) => runBacktest(history, { years: input.years, costPerTicket: input.costPerTicket })),
})
EOF

cat > src/server/routers/generator.ts <<'EOF'
import { z } from 'zod'
import { publicProcedure, router } from '../trpc'
import { generateWithFilters } from '@/lib/generator'

export const generatorRouter = router({
  generate: publicProcedure
    .input(z.object({
      preset: z.enum(['balanced','aggressive','conservative']).optional(),
      sumMin: z.number().optional(),
      sumMax: z.number().optional(),
      oddEven: z.tuple([z.number(), z.number()]).optional(),
      limit: z.number().optional()
    })).query(({ input }) => {
      const sumRange = input.sumMin !== undefined && input.sumMax !== undefined ? [input.sumMin, input.sumMax] as [number,number] : undefined
      const opts: any = { limit: input.limit ?? 100 }
      if (input.preset) opts.preset = input.preset
      if (sumRange) opts.sumRange = sumRange
      if (input.oddEven) opts.oddEven = input.oddEven
      return generateWithFilters(opts)
    })
})
EOF

cat > src/server/routers/index.ts <<'EOF'
import { router } from '../trpc'
import { analysisRouter } from './analysis'
import { simulationRouter } from './simulation'
import { generatorRouter } from './generator'

export const appRouter = router({
  analysis: analysisRouter,
  simulation: simulationRouter,
  generator: generatorRouter
})

export type AppRouter = typeof appRouter
EOF

cat > src/app/api/trpc/route.ts <<'EOF'
import { createNextRouteHandler } from '@trpc/server/adapters/next'
import { appRouter } from '@/server/routers'
import { createContext } from '@/server/context'

export const GET = createNextRouteHandler({
  router: appRouter,
  createContext,
})

export const POST = createNextRouteHandler({
  router: appRouter,
  createContext,
})
EOF

# trpc client util
cat > src/utils/trpc.ts <<'EOF'
import { httpBatchLink } from '@trpc/client'
import { createTRPCReact } from '@trpc/react-query'
import type { AppRouter } from '@/server/routers'

export const trpc = createTRPCReact<AppRouter>()

export function getBaseUrl() {
  return ''
}

export function createTrpcClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${getBaseUrl() || ''}/api/trpc`,
      }),
    ],
  })
}
EOF

# Components
cat > src/components/TrpcProvider.tsx <<'EOF'
'use client'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { trpc, createTrpcClient } from '@/utils/trpc'

export default function TrpcProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(() => new QueryClient())
  const [trpcClient] = React.useState(() => createTrpcClient())

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  )
}
EOF

cat > src/components/ui/NumberGrid.tsx <<'EOF'
export default function NumberGrid({ numbers }: { numbers: number[] }) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {numbers.map((n) => (
        <div key={n} className="p-2 rounded-full bg-slate-100 text-center">
          {n}
        </div>
      ))}
    </div>
  )
}
EOF

cat > src/components/ui/FilterPanel.tsx <<'EOF'
import React from 'react'

export default function FilterPanel({ children }: { children?: React.ReactNode }) {
  return <div className="p-4 bg-white rounded shadow">{children}</div>
}
EOF

cat > src/components/analysis/AnalysisView.tsx <<'EOF'
import NumberGrid from '@/components/ui/NumberGrid'
import { analyzeMissingRange, analyzeCooccurrence, analyzeConsecutive } from '@/lib/analysis'
import history from '@/mock/lottoHistory'

export default function AnalysisView() {
  const missing = analyzeMissingRange(history, 3)
  const coocc = analyzeCooccurrence(history, 3)
  const consecutive = analyzeConsecutive(history)

  return (
    <div>
      <h2 className="text-xl font-semibold">Analysis</h2>
      <section className="mt-4">
        <h3 className="font-medium">Missing (>=3 draws)</h3>
        <div className="mt-2">
          {missing.map((m) => (
            <div key={m.number} className="flex items-center justify-between p-2 border-b">
              <span>Number {m.number}</span>
              <span className="text-sm text-slate-500">{m.missingCount} draws</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h3 className="font-medium">Co-occurrence (>=3)</h3>
        <pre className="mt-2 text-sm bg-slate-50 p-2 rounded">{JSON.stringify(coocc.slice(0, 20), null, 2)}</pre>
      </section>

      <section className="mt-6">
        <h3 className="font-medium">Consecutive Appearance Probability</h3>
        <pre className="mt-2 text-sm bg-slate-50 p-2 rounded">{JSON.stringify(consecutive, null, 2)}</pre>
      </section>
    </div>
  )
}
EOF

cat > src/components/analysis/MissingRangeClient.tsx <<'EOF'
'use client'

import React from 'react'
import { trpc } from '@/utils/trpc'

export default function MissingRangeClient({ weeks = 3 }: { weeks?: number }) {
  const query = trpc.analysis.missingRange.useQuery({ weeks })

  if (query.isLoading) {
    return (
      <div className="p-4 bg-white rounded shadow">
        <div className="text-slate-500">Loading missing range…</div>
      </div>
    )
  }

  if (query.isError) {
    return (
      <div className="p-4 bg-red-50 rounded border border-red-100">
        <div className="text-red-600 font-medium">Failed to load missing range</div>
        <div className="mt-2 text-sm text-red-700">{String(query.error?.message ?? 'Unknown error')}</div>
      </div>
    )
  }

  const data = query.data ?? []

  if (!data.length) {
    return (
      <div className="p-4 bg-yellow-50 rounded border border-yellow-100">
        <div className="text-yellow-700">No numbers missing for {weeks} or more draws.</div>
      </div>
    )
  }

  return (
    <div className="p-4 bg-white rounded shadow">
      <h4 className="text-lg font-semibold">Numbers missing for at least {weeks} draws</h4>
      <ul className="mt-3 space-y-2">
        {data.map((row: any) => (
          <li key={row.number} className="flex items-center justify-between border-b pb-2">
            <div className="text-slate-700">#{String(row.number).padStart(2, '0')}</div>
            <div className="text-slate-500 text-sm">{row.missingCount} draws</div>
          </li>
        ))}
      </ul>
    </div>
  )
}
EOF

cat > src/components/simulation/SimulationView.tsx <<'EOF'
import { runBacktest } from '@/lib/simulation'
import history from '@/mock/lottoHistory'

export default function SimulationView() {
  const res = runBacktest(history, { years: 10, costPerTicket: 1 })
  return (
    <div>
      <h2 className="text-xl font-semibold">10-Year Backtest</h2>
      <pre className="mt-4 p-3 bg-slate-50 rounded">{JSON.stringify(res, null, 2)}</pre>
    </div>
  )
}
EOF

cat > src/components/generator/GeneratorView.tsx <<'EOF'
import { generateWithFilters } from '@/lib/generator'

export default function GeneratorView() {
  const picks = generateWithFilters({ preset: 'balanced', sumRange: [130, 170], oddEven: [3,3] })
  return (
    <div>
      <h2 className="text-xl font-semibold">Generator</h2>
      <div className="mt-4">
        {picks.slice(0, 12).map((p, i) => (
          <div key={i} className="mb-2">
            <strong>Pick {i+1}:</strong> {p.join(', ')}
          </div>
        ))}
      </div>
    </div>
  )
}
EOF

# Tests and setup
cat > src/setupTests.ts <<'EOF'
import '@testing-library/jest-dom'
EOF

cat > src/components/analysis/__tests__/MissingRangeClient.test.tsx <<'EOF'
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

function mockTrpcWith(useQueryImpl: any) {
  vi.mock('@/utils/trpc', () => {
    return {
      trpc: {
        analysis: {
          missingRange: {
            useQuery: (args: any) => useQueryImpl(args),
          },
        },
      },
    }
  })
}

afterEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
})

describe('MissingRangeClient', () => {
  it('renders loading state', async () => {
    mockTrpcWith(() => ({ isLoading: true, isError: false }))

    const { default: MissingRangeClientModule } = await import('@/components/analysis/MissingRangeClient')
    const MissingRangeClientComp = MissingRangeClientModule.default

    render(<MissingRangeClientComp weeks={3} />)

    expect(screen.getByText(/Loading missing range/i)).toBeInTheDocument()
  })

  it('renders error state', async () => {
    mockTrpcWith(() => ({ isLoading: false, isError: true, error: { message: 'Network failure' } }))

    const { default: MissingRangeClientModule } = await import('@/components/analysis/MissingRangeClient')
    const MissingRangeClientComp = MissingRangeClientModule.default

    render(<MissingRangeClientComp weeks={3} />)

    await waitFor(() => {
      expect(screen.getByText(/Failed to load missing range/i)).toBeInTheDocument()
      expect(screen.getByText(/Network failure/)).toBeInTheDocument()
    })
  })

  it('renders data state', async () => {
    const sampleData = [
      { number: 7, missingCount: 10 },
      { number: 13, missingCount: 5 },
    ]
    mockTrpcWith(() => ({ isLoading: false, isError: false, data: sampleData }))

    const { default: MissingRangeClientModule } = await import('@/components/analysis/MissingRangeClient')
    const MissingRangeClientComp = MissingRangeClientModule.default

    render(<MissingRangeClientComp weeks={3} />)

    await waitFor(() => {
      expect(screen.getByText(/Numbers missing for at least 3 draws/i)).toBeInTheDocument()
      expect(screen.getByText('#07')).toBeInTheDocument()
      expect(screen.getByText('#13')).toBeInTheDocument()
      expect(screen.getByText('10 draws')).toBeInTheDocument()
      expect(screen.getByText('5 draws')).toBeInTheDocument()
    })
  })
})
EOF

# Styles
cat > src/styles/globals.css <<'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;
body { @apply bg-white; }
EOF

# CI workflow
cat > .github/workflows/ci.yml <<'EOF'
name: CI

on:
  push:
    branches:
      - main
      - master
  pull_request:
    branches:
      - '**'

jobs:
  test-and-lint:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x]
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Cache node modules and npm cache
        uses: actions/cache@v4
        with:
          path: |
            ~/.npm
            node_modules
          key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json', '**/pnpm-lock.yaml', '**/yarn.lock') }}
          restore-keys: |
            ${{ runner.os }}-node-

      - name: Install dependencies
        run: |
          if [ -f package-lock.json ]; then
            npm ci
          else
            npm install
          fi

      - name: Run TypeScript typecheck
        run: npm run typecheck

      - name: Biome format check (fail if not formatted)
        run: npx biome format --check

      - name: Run Biome lint
        run: npm run lint

      - name: Run tests with coverage (Vitest)
        run: npm run test:coverage

      - name: Upload coverage artifact
        uses: actions/upload-artifact@v4
        with:
          name: vitest-coverage
          path: coverage
EOF

# Final message
cat <<'MSG'

Initialization complete.

Next steps (locally):
1. Ensure you're on the branch feature/init-lotto-architecture:
   git checkout feature/init-lotto-architecture

2. Add & commit the files:
   git add .
   git commit -m "chore: init Lotto Analysis architecture (Next.js, tRPC, Drizzle, Supabase SSR, Biome, Vitest)"

3. Push branch:
   git push origin feature/init-lotto-architecture

4. Open a PR with the title and body provided earlier (or use the gh CLI):
   gh pr create --base main --head feature/init-lotto-architecture --title "Feature: initialize Lotto Analysis architecture (Next.js + tRPC + Drizzle + Supabase SSR + Biome + Vitest)" --body "PR BODY"

PR body (short):
This PR bootstraps the Lotto Analysis & Simulation Platform foundation:
- Next.js App Router + TypeScript + Tailwind
- tRPC routers + Supabase SSR context
- Drizzle schema + drizzle-zod
- Mock data (2,200 draws)
- Biome + Vitest + RTL tests
- CI workflow (Biome format check + lint + tests + coverage + caching)

MSG

# Make the script executable
chmod +x "$0"
```