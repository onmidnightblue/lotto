'use client'

import { useState, useRef, useEffect } from 'react'
import { trpc } from '@/components/TrpcProvider'
import { getBallColorClass } from '@/lib/utils/ballColors'

const PAGE_SIZE = 20

export default function HistorySearch() {
  const [searchNumbers, setSearchNumbers] = useState<string>('')
  const [period, setPeriod] = useState<'all' | '1year' | '6months' | '3months' | '1month'>('all')
  const [prizeAmount, setPrizeAmount] = useState<'30억이상' | '20억대' | '10억대' | undefined>(undefined)
  const [winnerCount, setWinnerCount] = useState<'10명이하' | '10명대' | '20명대' | '30명대' | undefined>(undefined)
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'prize-desc' | 'prize-asc' | 'winner-desc' | 'winner-asc'>('date-desc')
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false)
  const [page, setPage] = useState(1)
  const sortDropdownRef = useRef<HTMLDivElement>(null)

  const parseNumbers = (input: string): number[] => {
    return input
      .split(/[,\s]+/)
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n) && n >= 1 && n <= 45)
  }

  const numbers = parseNumbers(searchNumbers)

  // 정렬 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setSortDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const { data, isLoading } = trpc.lotto.search.useQuery({
    numbers: numbers.length > 0 ? numbers : undefined,
    period,
    prizeAmount: prizeAmount,
    winnerCount: winnerCount,
    sortBy,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  })

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0
  const startItem = data && data.total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0
  const endItem = data ? Math.min(page * PAGE_SIZE, data.total) : 0

  // 필터/정렬 변경 시 1페이지로
  useEffect(() => {
    setPage(1)
  }, [period, prizeAmount, winnerCount, sortBy, searchNumbers])

  const highlightNumber = (num: number, targetNumbers: number[]) => {
    if (targetNumbers.length === 0) return false
    return targetNumbers.includes(num)
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            번호 검색 (쉼표 또는 공백으로 구분)
          </label>
          <input
            type="text"
            value={searchNumbers}
            onChange={(e) => setSearchNumbers(e.target.value)}
            placeholder="1, 5, 10, 15, 20, 25"
            className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
          />
          {numbers.length > 0 && (
            <p className="mt-2 text-sm text-slate-600">
              검색 중인 번호: {numbers.join(', ')}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">기간</label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPeriod('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                period === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              전체
            </button>
            <button
              type="button"
              onClick={() => setPeriod('1year')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                period === '1year'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              최근 1년
            </button>
            <button
              type="button"
              onClick={() => setPeriod('6months')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                period === '6months'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              최근 6개월
            </button>
            <button
              type="button"
              onClick={() => setPeriod('3months')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                period === '3months'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              최근 3개월
            </button>
            <button
              type="button"
              onClick={() => setPeriod('1month')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                period === '1month'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              최근 1개월
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">당첨금액</label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPrizeAmount(undefined)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                prizeAmount === undefined
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              전체
            </button>
            <button
              type="button"
              onClick={() => setPrizeAmount('30억이상')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                prizeAmount === '30억이상'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              30억 이상
            </button>
            <button
              type="button"
              onClick={() => setPrizeAmount('20억대')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                prizeAmount === '20억대'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              20억대
            </button>
            <button
              type="button"
              onClick={() => setPrizeAmount('10억대')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                prizeAmount === '10억대'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              10억대
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">당첨자수</label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setWinnerCount(undefined)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                winnerCount === undefined
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              전체
            </button>
            <button
              type="button"
              onClick={() => setWinnerCount('10명이하')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                winnerCount === '10명이하'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              10명 이하
            </button>
            <button
              type="button"
              onClick={() => setWinnerCount('10명대')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                winnerCount === '10명대'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              10명대
            </button>
            <button
              type="button"
              onClick={() => setWinnerCount('20명대')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                winnerCount === '20명대'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              20명대
            </button>
            <button
              type="button"
              onClick={() => setWinnerCount('30명대')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                winnerCount === '30명대'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              30명대
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold">검색 결과</h2>
            {data && (
              <span className="text-sm text-slate-500">
                총 {data.total}개
                {data.total > 0 && (
                  <span className="text-slate-400 ml-1">
                    ({startItem}–{endItem}번째)
                  </span>
                )}
              </span>
            )}
          </div>
          <div className="relative" ref={sortDropdownRef}>
            <button
              type="button"
              onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
              className="px-3 py-1.5 text-sm rounded-md font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors flex items-center gap-1"
            >
              {[
                { value: 'date-desc', label: '최신순' },
                { value: 'date-asc', label: '오래된순' },
                { value: 'prize-desc', label: '당첨금 높은순' },
                { value: 'prize-asc', label: '당첨금 낮은순' },
                { value: 'winner-desc', label: '당첨자 많은순' },
                { value: 'winner-asc', label: '당첨자 적은순' },
              ].find(opt => opt.value === sortBy)?.label || '최신순'}
              <span className="text-xs">▾</span>
            </button>
            {sortDropdownOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-10 min-w-[140px]">
                {[
                  { value: 'date-desc', label: '최신순' },
                  { value: 'date-asc', label: '오래된순' },
                  { value: 'prize-desc', label: '당첨금 높은순' },
                  { value: 'prize-asc', label: '당첨금 낮은순' },
                  { value: 'winner-desc', label: '당첨자 많은순' },
                  { value: 'winner-asc', label: '당첨자 적은순' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setSortBy(option.value as any)
                      setSortDropdownOpen(false)
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors ${
                      sortBy === option.value
                        ? 'bg-slate-100 text-slate-900 font-medium'
                        : 'text-slate-700'
                    } ${option.value === 'date-desc' ? 'rounded-t-md' : ''} ${
                      option.value === 'winner-asc' ? 'rounded-b-md' : ''
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-slate-600">로딩 중...</div>
        ) : !data || data.results.length === 0 ? (
          <div className="text-center py-8 text-slate-600">검색 결과가 없습니다.</div>
        ) : (
          <div className="space-y-4">
            {data.results.map((result) => {
              const numbers = (result.numbers as number[]) || []
              const bonus = result.bonus
              const drawDate = new Date(result.draw_date)

              return (
                <div
                  key={result.id}
                  className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="mb-3">
                    <span className="text-sm text-slate-600">
                      #{result.id} ({drawDate.getFullYear()}.{String(drawDate.getMonth() + 1).padStart(2, '0')}.{String(drawDate.getDate()).padStart(2, '0')})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-slate-700">번호:</span>
                    <div className="flex gap-1">
                      {numbers.map((num) => {
                        const isHighlighted = highlightNumber(num, parseNumbers(searchNumbers))
                        return (
                          <span
                            key={num}
                            className={`relative w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${getBallColorClass(num)}`}
                          >
                            {num}
                            {isHighlighted && (
                              <span
                                className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-3.5 h-3.5 rounded-full bg-slate-700 text-white text-[10px] font-bold leading-none"
                                aria-hidden
                              >
                                ✓
                              </span>
                            )}
                          </span>
                        )
                      })}
                    </div>
                    <span className="text-sm text-slate-500 ml-2">
                      +{' '}
                      <span
                        className={`relative inline-flex items-center justify-center px-2 py-1 rounded font-semibold ${getBallColorClass(bonus)}`}
                      >
                        {bonus}
                        {highlightNumber(bonus, parseNumbers(searchNumbers)) && (
                          <span
                            className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-3.5 h-3.5 rounded-full bg-slate-700 text-white text-[10px] font-bold leading-none"
                            aria-hidden
                          >
                            ✓
                          </span>
                        )}
                      </span>
                    </span>
                  </div>

                  {(result.prize_amount && result.winner_count) && (
                    <div className="text-sm text-slate-600 mt-2">
                      <span>
                        {result.winner_count}명이{' '}
                        <span className="font-semibold text-slate-900">
                          {Math.round(result.prize_amount / 100000000)}억원
                        </span>
                        을 수령
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {data && data.total > PAGE_SIZE && (
          <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="px-3 py-1 text-sm border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                첫 페이지
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
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
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1 text-sm border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                다음
              </button>
              <button
                type="button"
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                className="px-3 py-1 text-sm border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                마지막 페이지
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
