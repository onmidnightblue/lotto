'use client'

import { useState } from 'react'
import { trpc } from '@/components/TrpcProvider'
import { getBallColorClass } from '@/lib/utils/ballColors'

type CooccurrenceMissingProps = {
  size: '3' | '4'
  title: string
}

const ITEMS_PER_PAGE = 20

export default function CooccurrenceMissing({ size, title }: CooccurrenceMissingProps) {
  const [page, setPage] = useState(1)

  const { data, isLoading } = trpc.analysis.cooccurrenceMissing.useQuery({
    size,
    limit: 1000, // 전체 데이터 가져오기
  })

  const totalItems = data?.length || 0
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)
  const startIndex = (page - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentData = data?.slice(startIndex, endIndex) || []

  const goToFirstPage = () => setPage(1)
  const goToLastPage = () => setPage(totalPages)
  const goToPrevPage = () => setPage((p) => Math.max(1, p - 1))
  const goToNextPage = () => setPage((p) => Math.min(totalPages, p + 1))

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-slate-600">로딩 중...</div>
      ) : !data || data.length === 0 ? (
        <div className="text-center py-8 text-slate-600">데이터가 없습니다.</div>
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
