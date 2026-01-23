'use client'

import { useState, useMemo } from 'react'
import { trpc } from '@/components/TrpcProvider'
import { getBallColorClass } from '@/lib/utils/ballColors'

type CooccurrenceFrequencyProps = {
  size: '3' | '4'
  title: string
}

const ITEMS_PER_PAGE = 5

export default function CooccurrenceFrequency({ size, title }: CooccurrenceFrequencyProps) {
  const [page, setPage] = useState(1)
  const [searchNumbers, setSearchNumbers] = useState<string>('')

  const { data, isLoading } = trpc.analysis.cooccurrenceFrequency.useQuery({
    size,
    // limit 없이 전체 데이터 가져오기
  })

  // 검색 필터링
  const filteredData = useMemo(() => {
    if (!data) return []
    if (!searchNumbers.trim()) return data
    
    const searchNums = searchNumbers
      .split(/[,\s]+/)
      .map(s => parseInt(s.trim(), 10))
      .filter(n => !isNaN(n) && n >= 1 && n <= 45)
    
    if (searchNums.length === 0) return data
    
    // 검색된 숫자 모두를 포함한 조합 필터링
    return data.filter(item => 
      searchNums.every(num => item.combination.includes(num))
    )
  }, [data, searchNumbers])

  const totalItems = filteredData.length
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)
  const startIndex = (page - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentData = filteredData.slice(startIndex, endIndex)

  // 검색어가 변경되면 첫 페이지로 리셋
  const handleSearchChange = (value: string) => {
    setSearchNumbers(value)
    setPage(1)
  }

  const goToFirstPage = () => setPage(1)
  const goToLastPage = () => setPage(totalPages)
  const goToPrevPage = () => setPage((p) => Math.max(1, p - 1))
  const goToNextPage = () => setPage((p) => Math.min(totalPages, p + 1))

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={searchNumbers}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="번호 검색 (예: 1, 5, 10)"
            className="px-3 py-1.5 border border-slate-300 rounded-md text-sm w-48 focus:outline-none focus:ring-2 focus:ring-slate-500"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-slate-600">로딩 중...</div>
      ) : !data || data.length === 0 ? (
        <div className="text-center py-8 text-slate-600">데이터가 없습니다.</div>
      ) : filteredData.length === 0 && searchNumbers.trim() ? (
        <div className="text-center py-8 text-slate-600">검색 결과가 없습니다.</div>
      ) : (
        <>
          <div className="space-y-3 mb-6">
            {currentData.map((item, index) => (
              <div
                key={index}
                className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {item.combination.map((num) => (
                        <span
                          key={num}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${getBallColorClass(num)}`}
                        >
                          {num}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-sm text-slate-600">
                    출현 횟수: <span className="font-semibold text-slate-900">{item.count}회</span>
                  </div>
                </div>
                {item.rounds && item.rounds.length > 0 && (
                  <div className="text-xs text-slate-500 mt-2">
                    회차: {item.rounds.slice(0, 10).join(', ')}
                    {item.rounds.length > 10 && ` 외 ${item.rounds.length - 10}개`}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 pt-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={goToFirstPage}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  첫 페이지
                </button>
                <button
                  onClick={goToPrevPage}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  이전
                </button>
              </div>
              <div className="text-sm text-slate-600">
                {page} / {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={goToNextPage}
                  disabled={page === totalPages}
                  className="px-3 py-1 text-sm border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  다음
                </button>
                <button
                  onClick={goToLastPage}
                  disabled={page === totalPages}
                  className="px-3 py-1 text-sm border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  마지막 페이지
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
