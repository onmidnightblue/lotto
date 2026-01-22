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
