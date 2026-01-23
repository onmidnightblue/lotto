import React from 'react'
import ServerAnalysis from './server-analysis'
import MissingRangeClient from '@/components/analysis/MissingRangeClient'

export const metadata = {
  title: '패턴분석 · Lotto Analysis',
  description: '로또 번호 패턴 분석',
}

export const dynamic = 'force-dynamic'

export default async function AnalysisPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold">패턴분석</h1>
        <p className="text-slate-600 mt-1">로또 번호의 패턴을 분석합니다.</p>
      </header>

      <section>
        {/* @ts-expect-error - Next.js 13+ async Server Components are supported but TypeScript types are not fully updated */}
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
