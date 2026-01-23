'use client'

import { useState } from 'react'
import { trpc } from '@/components/TrpcProvider'
import { getBallColorClass } from '@/lib/utils/ballColors'

export default function MissingNumbers() {
  const [weeks, setWeeks] = useState(4)

  const { data, isLoading } = trpc.analysis.missingNumbers.useQuery({
    weeks,
    sortBy: 'date-desc',
  })

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold">휴식중</h2>
          <p className="text-sm text-slate-500 mt-1">최근 n주 동안 나오지 않은 번호들</p>
        </div>
        <div className="flex items-center gap-2">
          {[4, 8, 12, 16].map((week) => (
            <button
              key={week}
              onClick={() => setWeeks(week)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                weeks === week
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {week}주
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-slate-600">로딩 중...</div>
      ) : !data || data.length === 0 ? (
        <div className="text-center py-8 text-slate-600">
          최근 {weeks}주 동안 모든 번호가 나왔습니다.
        </div>
      ) : (
        <div>
          <div className="mb-4 text-sm text-slate-600">
            총 <span className="font-semibold text-slate-900">{data.length}개</span>의 번호가 최근{' '}
            {weeks}주 동안 나오지 않았습니다.
          </div>
          <div className="space-y-6">
            {[
              { label: '1번대', range: [1, 10] },
              { label: '11번대', range: [11, 20] },
              { label: '21번대', range: [21, 30] },
              { label: '31번대', range: [31, 40] },
              { label: '41번대', range: [41, 45] },
            ].map((group) => {
              const groupNumbers = [...data]
                .filter((item) => item.number >= group.range[0] && item.number <= group.range[1])
                .sort((a, b) => a.number - b.number)
              
              if (groupNumbers.length === 0) return null
              
              return (
                <div key={group.label}>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">{group.label}</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 gap-2">
                    {groupNumbers.map((item) => {
                      return (
                        <div
                          key={item.number}
                          className="border border-slate-200 rounded-lg p-3 text-center hover:bg-slate-50 transition-colors"
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold mx-auto mb-2 ${getBallColorClass(item.number)}`}>
                            {item.number}
                          </div>
                          {item.drawId > 0 ? (
                            <div className="text-xs text-slate-500">
                              {item.drawId}회
                            </div>
                          ) : (
                            <div className="text-xs text-slate-400">미출현</div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
