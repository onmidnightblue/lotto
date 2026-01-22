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
