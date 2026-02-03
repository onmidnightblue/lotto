'use client'

import { useState } from 'react'
import { trpc } from '@/components/TrpcProvider'

function parseNumbers(value: string): number[] {
  return value
    .split(/[,\s]+/)
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n) && n >= 1 && n <= 45)
}

const YEARS_OPTIONS = [1, 3, 5, 10] as const
type YearsOption = (typeof YEARS_OPTIONS)[number]

export default function SimulationView() {
  const [numbersInput, setNumbersInput] = useState('')
  const [years, setYears] = useState<YearsOption>(10)
  const [submitted, setSubmitted] = useState<{ numbers: number[]; years: YearsOption } | null>(null)

  const { data, isLoading, isError, error } = trpc.lotto.simulateTenYears.useQuery(
    submitted ?? { numbers: [1, 2, 3, 4, 5, 6], years: 10 },
    { enabled: submitted !== null }
  )

  const handleRun = () => {
    const nums = parseNumbers(numbersInput)
    if (nums.length !== 6) {
      alert('번호 6개를 입력해주세요. (1–45, 쉼표/공백 구분)')
      return
    }
    const uniq = new Set(nums)
    if (uniq.size !== 6) {
      alert('번호 6개는 서로 달라야 합니다.')
      return
    }
    setSubmitted({ numbers: nums, years })
  }

  const displayYears = submitted?.years ?? years

  const formatMoney = (n: number) => {
    if (n >= 1e8) return `${(n / 1e8).toFixed(1)}억`
    if (n >= 1e4) return `${(n / 1e4).toFixed(0)}만`
    return `${n.toLocaleString()}`
  }

  const userNumberSet = submitted ? new Set(submitted.numbers) : new Set<number>()

  const DrawBalls = ({
    numbers,
    bonus,
  }: {
    numbers: number[]
    bonus?: number
  }) => (
    <span className="inline-flex items-center gap-0.5 flex-wrap">
      {numbers.map((n, j) => {
        const isMatch = userNumberSet.has(n)
        return (
          <span
            key={j}
            className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium border ${
              isMatch
                ? 'bg-slate-700 border-slate-700 text-white'
                : 'border-slate-300 text-slate-700 bg-white'
            }`}
          >
            {n}
          </span>
        )
      })}
      {bonus != null && (
        <span
          className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium border border-slate-300 text-slate-700 bg-white"
          title="보너스"
        >
          +{bonus}
        </span>
      )}
    </span>
  )

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-2 flex flex-wrap items-center gap-1">
          이 번호로{' '}
          <select
            value={years}
            onChange={(e) => setYears(Number(e.target.value) as YearsOption)}
            className="px-2 py-1 border border-slate-300 rounded-md text-base font-semibold bg-white"
            aria-label="기간 선택"
          >
            {YEARS_OPTIONS.map((y) => (
              <option key={y} value={y}>
                {y}년
              </option>
            ))}
          </select>
          년 동안 샀다면?
        </h2>
        <p className="text-slate-600 text-sm mb-4">
          선택한 기간 동안 매 회차 1장(1,000원)씩 구매했을 때의 수익 시뮬레이션입니다.
        </p>

        <div className="space-y-3 max-w-xl">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">당첨 번호 6개</label>
            <input
              type="text"
              value={numbersInput}
              onChange={(e) => setNumbersInput(e.target.value)}
              placeholder="3, 12, 19, 27, 33, 41"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
            />
          </div>
          <button
            type="button"
            onClick={handleRun}
            className="px-4 py-2 bg-slate-900 text-white rounded-md font-medium hover:bg-slate-800"
          >
            시뮬레이션 실행
          </button>
        </div>
      </div>

      {submitted !== null && (
        <div className="bg-white rounded-lg shadow p-6">
          {isLoading && <p className="text-slate-600">계산 중...</p>}
          {isError && (
            <p className="text-red-600">
              {error?.message ?? '조회 실패'}
            </p>
          )}
          {data && !isLoading && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="text-xs text-slate-500">{displayYears}년간 구매액</div>
                  <div className="text-lg font-semibold">{formatMoney(data.totalSpent)}원</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="text-xs text-slate-500">총 당첨금</div>
                  <div className="text-lg font-semibold">{formatMoney(data.totalWon)}원</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="text-xs text-slate-500">손익</div>
                  <div className={`text-lg font-semibold ${data.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {data.profit >= 0 ? '+' : ''}{formatMoney(data.profit)}원
                  </div>
                </div>
              </div>
              {data.wins.length > 0 && (
                <>
                  <h3 className="font-semibold">당첨 내역 ({data.wins.length}건)</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-2">회차</th>
                          <th className="text-left py-2">추첨일</th>
                          <th className="text-left py-2">당첨번호</th>
                          <th className="text-left py-2">등수</th>
                          <th className="text-right py-2">당첨금</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.wins.map((w, i) => (
                          <tr key={i} className="border-b border-slate-100">
                            <td className="py-2">{w.round}회</td>
                            <td className="py-2 text-slate-600">{w.date}</td>
                            <td className="py-2">
                              <DrawBalls numbers={w.numbers ?? []} bonus={w.bonus} />
                            </td>
                            <td className="py-2">{w.rank}등</td>
                            <td className="py-2 text-right font-medium">{formatMoney(w.prize)}원</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
              {data.wins.length === 0 && data.drawCount > 0 && (
                <p className="text-slate-500">당첨 내역이 없습니다.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
