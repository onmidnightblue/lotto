'use client'

import { trpc } from '@/components/TrpcProvider'

export default function MissingRangeClient({ weeks = 3 }: { weeks?: number }) {
  const { data, isLoading } = trpc.analysis.missingRange.useQuery({ weeks })

  if (isLoading) {
    return (
      <div>
        <h3 className="text-lg font-semibold">Missing Range Analysis (Client)</h3>
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-lg font-semibold">Missing Range Analysis (Client)</h3>
      <div className="mt-4">
        {!data || data.length === 0 ? (
          <div className="p-3 bg-yellow-50 rounded">No missing numbers for {weeks} draws or more.</div>
        ) : (
          <ul className="space-y-2">
            {data.slice(0, 50).map((m) => (
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
