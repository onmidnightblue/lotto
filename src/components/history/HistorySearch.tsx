'use client'

import { useState } from 'react'
import { trpc } from '@/components/TrpcProvider'

export default function HistorySearch() {
  const [searchNumbers, setSearchNumbers] = useState<string>('')
  const [period, setPeriod] = useState<'all' | '1year' | '6months' | '3months' | '1month' | 'custom'>('all')
  const [prizeAmount, setPrizeAmount] = useState<'30억이상' | '20억대' | '10억대' | 'custom' | undefined>(undefined)
  const [customPrizeMin, setCustomPrizeMin] = useState<string>('')
  const [customPrizeMax, setCustomPrizeMax] = useState<string>('')
  const [winnerCount, setWinnerCount] = useState<'10명이하' | '10명대' | '20명대' | '30명대' | undefined>(undefined)
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'prize-desc' | 'prize-asc' | 'winner-desc' | 'winner-asc'>('date-desc')
  const [customStartDate, setCustomStartDate] = useState<string>('')
  const [customEndDate, setCustomEndDate] = useState<string>('')

  const parseNumbers = (input: string): number[] => {
    return input
      .split(/[,\s]+/)
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n) && n >= 1 && n <= 45)
  }

  const numbers = parseNumbers(searchNumbers)

  const { data, isLoading } = trpc.lotto.search.useQuery({
    numbers: numbers.length > 0 ? numbers : undefined,
    period,
    customStartDate: period === 'custom' && customStartDate ? new Date(customStartDate) : undefined,
    customEndDate: period === 'custom' && customEndDate ? new Date(customEndDate) : undefined,
    prizeAmount: prizeAmount,
    customPrizeMin: prizeAmount === 'custom' && customPrizeMin ? parseInt(customPrizeMin.replace(/[,\s원억만]/g, '')) * (customPrizeMin.includes('억') ? 100000000 : 1) : undefined,
    customPrizeMax: prizeAmount === 'custom' && customPrizeMax ? parseInt(customPrizeMax.replace(/[,\s원억만]/g, '')) * (customPrizeMax.includes('억') ? 100000000 : 1) : undefined,
    winnerCount: winnerCount,
    sortBy,
    limit: 100,
  })

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
            placeholder="예: 1, 5, 10, 15, 20, 25"
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
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
          >
            <option value="all">전체</option>
            <option value="1year">최근 1년</option>
            <option value="6months">최근 6개월</option>
            <option value="3months">최근 3개월</option>
            <option value="1month">최근 1개월</option>
            <option value="custom">직접 설정</option>
          </select>

          {period === 'custom' && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-slate-600 mb-1">시작일</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-3 py-1 border border-slate-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">종료일</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-3 py-1 border border-slate-300 rounded-md text-sm"
                />
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">당첨금액</label>
          <select
            value={prizeAmount || ''}
            onChange={(e) => setPrizeAmount(e.target.value ? (e.target.value as any) : undefined)}
            className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
          >
            <option value="">전체</option>
            <option value="30억이상">30억 이상</option>
            <option value="20억대">20억대</option>
            <option value="10억대">10억대</option>
            <option value="custom">직접 설정</option>
          </select>

          {prizeAmount === 'custom' && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-slate-600 mb-1">최소 금액</label>
                <input
                  type="text"
                  value={customPrizeMin}
                  onChange={(e) => setCustomPrizeMin(e.target.value)}
                  placeholder="예: 10억"
                  className="w-full px-3 py-1 border border-slate-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">최대 금액</label>
                <input
                  type="text"
                  value={customPrizeMax}
                  onChange={(e) => setCustomPrizeMax(e.target.value)}
                  placeholder="예: 50억"
                  className="w-full px-3 py-1 border border-slate-300 rounded-md text-sm"
                />
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">당첨자수</label>
          <select
            value={winnerCount || ''}
            onChange={(e) => setWinnerCount(e.target.value ? (e.target.value as any) : undefined)}
            className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
          >
            <option value="">전체</option>
            <option value="10명이하">10명 이하</option>
            <option value="10명대">10명대</option>
            <option value="20명대">20명대</option>
            <option value="30명대">30명대</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">정렬</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
          >
            <option value="date-desc">최신순</option>
            <option value="date-asc">오래된순</option>
            <option value="prize-desc">당첨금 높은순</option>
            <option value="prize-asc">당첨금 낮은순</option>
            <option value="winner-desc">당첨자 많은순</option>
            <option value="winner-asc">당첨자 적은순</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">검색 결과</h2>
          {data && (
            <span className="text-sm text-slate-600">총 {data.total}개</span>
          )}
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
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-sm text-slate-600">
                        {drawDate.toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="text-sm text-slate-500">회차 #{result.id}</div>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-slate-700">번호:</span>
                    <div className="flex gap-1">
                      {numbers.map((num) => {
                        const isHighlighted = highlightNumber(num, parseNumbers(searchNumbers))
                        return (
                          <span
                            key={num}
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                              isHighlighted
                                ? 'bg-yellow-400 text-slate-900 ring-2 ring-yellow-500'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {num}
                          </span>
                        )
                      })}
                    </div>
                    <span className="text-sm text-slate-500 ml-2">
                      보너스:{' '}
                      <span
                        className={
                          highlightNumber(bonus, parseNumbers(searchNumbers))
                            ? 'bg-yellow-400 text-slate-900 px-2 py-1 rounded font-semibold'
                            : ''
                        }
                      >
                        {bonus}
                      </span>
                    </span>
                  </div>

                  {(result.prize_amount || result.winner_count) && (
                    <div className="flex items-center gap-4 text-sm text-slate-600 mt-2">
                      {result.prize_amount && (
                        <span>
                          당첨금액:{' '}
                          <span className="font-semibold text-slate-900">
                            {Math.round(result.prize_amount / 100000000)}억원
                          </span>
                        </span>
                      )}
                      {result.winner_count && (
                        <span>
                          당첨자수:{' '}
                          <span className="font-semibold text-slate-900">{result.winner_count}명</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
