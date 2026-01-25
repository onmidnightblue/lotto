'use client'

import { useState } from 'react'
import { trpc } from '@/components/TrpcProvider'

function parseNumbers(value: string): number[] {
  return value
    .split(/[,\s]+/)
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n) && n >= 1 && n <= 45)
}

export default function AdminPage() {
  const [round, setRound] = useState('')
  const [drawDate, setDrawDate] = useState('')
  const [numbersInput, setNumbersInput] = useState('')
  const [bonus, setBonus] = useState('')
  const [prizeAmount, setPrizeAmount] = useState('')
  const [winnerCount, setWinnerCount] = useState('')
  const [lastCreatedId, setLastCreatedId] = useState<number | null>(null)
  const [selectedDrawId, setSelectedDrawId] = useState<number | null>(null)

  // 등수별 당첨금 (1~5등)
  const [prizeRows, setPrizeRows] = useState<
    { rank: number; prize_per_person: string; winner_count: string }[]
 >(
    [1, 2, 3, 4, 5].map((rank) => ({
      rank,
      prize_per_person: '',
      winner_count: '',
    }))
  )

  // 당첨 판매점
  const [storeRank, setStoreRank] = useState(1)
  const [storeName, setStoreName] = useState('')
  const [storeLocation, setStoreLocation] = useState('')
  const [storeMethod, setStoreMethod] = useState<'수동' | '자동' | '반자동' | ''>('')

  const createDraw = trpc.admin.createDraw.useMutation({
    onSuccess: (row) => {
      if (row) {
        setLastCreatedId(row.id)
        setSelectedDrawId(row.id)
      }
    },
  })
  const addPrizeStats = trpc.admin.addPrizeStats.useMutation()
  const addWinningStore = trpc.admin.addWinningStore.useMutation()
  const { data: recentDraws } = trpc.admin.listRecentDraws.useQuery({ limit: 50 }, { initialData: [] })

  const handleSubmitDraw = async (e: React.FormEvent) => {
    e.preventDefault()
    const nums = parseNumbers(numbersInput)
    if (nums.length !== 6) {
      alert('당첨 번호 6개를 입력해주세요. (1–45, 쉼표/공백 구분)')
      return
    }
    const bonusNum = parseInt(bonus, 10)
    if (isNaN(bonusNum) || bonusNum < 1 || bonusNum > 45) {
      alert('보너스 번호를 1–45 사이로 입력해주세요.')
      return
    }
    if (nums.includes(bonusNum)) {
      alert('보너스 번호는 당첨 번호 6개와 달라야 합니다.')
      return
    }
    const date = drawDate ? new Date(drawDate) : new Date()
    if (isNaN(date.getTime())) {
      alert('올바른 날짜를 입력해주세요.')
      return
    }
    const roundNum = parseInt(round, 10)
    if (!round.trim() || isNaN(roundNum) || roundNum < 1) {
      alert('회차 번호를 1 이상 숫자로 입력해주세요.')
      return
    }
    try {
      await createDraw.mutateAsync({
        round: roundNum,
        draw_date: date,
        numbers: nums,
        bonus: bonusNum,
        prize_amount: prizeAmount ? parseInt(prizeAmount.replace(/,/g, ''), 10) : null,
        winner_count: winnerCount ? parseInt(winnerCount, 10) : null,
      })
      setRound('')
      setDrawDate('')
      setNumbersInput('')
      setBonus('')
      setPrizeAmount('')
      setWinnerCount('')
    } catch (err: any) {
      alert(err?.message || '회차 등록에 실패했습니다.')
    }
  }

  const handleSubmitPrizeStats = async (e: React.FormEvent) => {
    e.preventDefault()
    const drawId = selectedDrawId ?? lastCreatedId
    if (!drawId) {
      alert('먼저 회차를 등록하거나 회차를 선택해주세요.')
      return
    }
    const rows = prizeRows
      .map((r) => ({
        rank: r.rank,
        prize_per_person: parseInt(r.prize_per_person.replace(/,/g, ''), 10),
        winner_count: parseInt(r.winner_count, 10),
      }))
      .filter((r) => !isNaN(r.prize_per_person) && !isNaN(r.winner_count) && r.winner_count >= 0)
    if (rows.length === 0) {
      alert('등수별 당첨금·당첨자 수를 입력해주세요.')
      return
    }
    try {
      await addPrizeStats.mutateAsync({ draw_id: drawId, rows })
      setPrizeRows([1, 2, 3, 4, 5].map((rank) => ({ rank, prize_per_person: '', winner_count: '' })))
    } catch (err: any) {
      alert(err?.message || '등수별 당첨금 저장에 실패했습니다.')
    }
  }

  const handleSubmitStore = async (e: React.FormEvent) => {
    e.preventDefault()
    const drawId = selectedDrawId ?? lastCreatedId
    if (!drawId) {
      alert('먼저 회차를 등록하거나 회차를 선택해주세요.')
      return
    }
    if (!storeName.trim()) {
      alert('판매점명을 입력해주세요.')
      return
    }
    try {
      await addWinningStore.mutateAsync({
        draw_id: drawId,
        rank: storeRank,
        store_name: storeName.trim(),
        location: storeLocation.trim() || null,
        method: storeMethod || null,
      })
      setStoreName('')
      setStoreLocation('')
      setStoreMethod('')
    } catch (err: any) {
      alert(err?.message || '당첨 판매점 저장에 실패했습니다.')
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold">관리실</h1>
        <p className="text-slate-600 mt-1">
          당첨 회차를 등록하면 odd_even, high_low, total_sum이 자동 계산되어 저장됩니다. 등수별 당첨금·당첨 판매점도 입력할 수 있습니다.
        </p>
      </header>

      {/* 회차 등록 */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">회차 등록</h2>
        <form onSubmit={handleSubmitDraw} className="space-y-4 max-w-xl">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">회차</label>
            <input
              type="number"
              min={1}
              required
              value={round}
              onChange={(e) => setRound(e.target.value)}
              placeholder="예: 1207"
              className="w-32 px-3 py-2 border border-slate-300 rounded-md text-sm"
            />
            <p className="text-xs text-slate-500 mt-1">회차 번호가 곧 DB id로 저장됩니다.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">추첨일</label>
            <input
              type="date"
              value={drawDate}
              onChange={(e) => setDrawDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              당첨 번호 6개 (쉼표 또는 공백 구분, 1–45)
            </label>
            <input
              type="text"
              value={numbersInput}
              onChange={(e) => setNumbersInput(e.target.value)}
              placeholder="예: 3, 12, 19, 27, 33, 41"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">보너스 번호</label>
            <input
              type="number"
              min={1}
              max={45}
              value={bonus}
              onChange={(e) => setBonus(e.target.value)}
              placeholder="1–45"
              className="w-24 px-3 py-2 border border-slate-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">1등 당첨금 (원)</label>
            <input
              type="text"
              value={prizeAmount}
              onChange={(e) => setPrizeAmount(e.target.value)}
              placeholder="예: 2000000000"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">1등 당첨자 수</label>
            <input
              type="number"
              min={0}
              value={winnerCount}
              onChange={(e) => setWinnerCount(e.target.value)}
              placeholder="0"
              className="w-32 px-3 py-2 border border-slate-300 rounded-md text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={createDraw.isPending}
            className="px-4 py-2 bg-slate-900 text-white rounded-md font-medium hover:bg-slate-800 disabled:opacity-50"
          >
            {createDraw.isPending ? '저장 중…' : '회차 저장'}
          </button>
        </form>
        {createDraw.data && (
          <div className="mt-4 p-3 bg-slate-50 rounded-md text-sm">
            저장됨 (id: {createDraw.data.id}). odd_even: {JSON.stringify(createDraw.data.odd_even)}, high_low:{' '}
            {JSON.stringify(createDraw.data.high_low)}, total_sum: {createDraw.data.total_sum}
          </div>
        )}
      </section>

      {/* 회차 선택 (등수별 당첨금·판매점용) */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-2">회차 선택</h2>
        <p className="text-slate-600 text-sm mb-3">
          아래에서 회차를 선택하면 등수별 당첨금·당첨 판매점을 해당 회차에 연결해 저장할 수 있습니다.
        </p>
        <select
          value={selectedDrawId ?? lastCreatedId ?? ''}
          onChange={(e) => setSelectedDrawId(e.target.value ? Number(e.target.value) : null)}
          className="px-3 py-2 border border-slate-300 rounded-md text-sm"
        >
          <option value="">선택 안 함</option>
          {(recentDraws ?? []).map((d: { id: number; draw_date: Date; numbers: number[] }) => (
            <option key={d.id} value={d.id}>
              {d.id}회 ({new Date(d.draw_date).toLocaleDateString('ko-KR')}) {Array.isArray(d.numbers) ? d.numbers.join(', ') : ''}
            </option>
          ))}
        </select>
      </section>

      {/* 등수별 당첨금 */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">등수별 당첨금</h2>
        <form onSubmit={handleSubmitPrizeStats} className="space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2">등수</th>
                  <th className="text-left py-2">1인당 금액 (원)</th>
                  <th className="text-left py-2">당첨자 수</th>
                </tr>
              </thead>
              <tbody>
                {prizeRows.map((r) => (
                  <tr key={r.rank} className="border-b border-slate-100">
                    <td className="py-2">{r.rank}등</td>
                    <td className="py-2">
                      <input
                        type="text"
                        value={r.prize_per_person}
                        onChange={(e) =>
                          setPrizeRows((prev) =>
                            prev.map((x) =>
                              x.rank === r.rank ? { ...x, prize_per_person: e.target.value } : x
                            )
                          )
                        }
                        placeholder="0"
                        className="w-40 px-2 py-1 border border-slate-300 rounded"
                      />
                    </td>
                    <td className="py-2">
                      <input
                        type="number"
                        min={0}
                        value={r.winner_count}
                        onChange={(e) =>
                          setPrizeRows((prev) =>
                            prev.map((x) =>
                              x.rank === r.rank ? { ...x, winner_count: e.target.value } : x
                            )
                          )
                        }
                        className="w-24 px-2 py-1 border border-slate-300 rounded"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="submit"
            disabled={addPrizeStats.isPending}
            className="px-4 py-2 bg-slate-900 text-white rounded-md font-medium hover:bg-slate-800 disabled:opacity-50"
          >
            {addPrizeStats.isPending ? '저장 중…' : '등수별 당첨금 저장'}
          </button>
        </form>
      </section>

      {/* 당첨 판매점 */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">당첨 판매점</h2>
        <form onSubmit={handleSubmitStore} className="space-y-4 max-w-xl">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">등수</label>
            <select
              value={storeRank}
              onChange={(e) => setStoreRank(Number(e.target.value))}
              className="px-3 py-2 border border-slate-300 rounded-md text-sm"
            >
              {[1, 2, 3, 4, 5].map((r) => (
                <option key={r} value={r}>
                  {r}등
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">판매점명</label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="예: OO복권방"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">주소 (선택)</label>
            <input
              type="text"
              value={storeLocation}
              onChange={(e) => setStoreLocation(e.target.value)}
              placeholder="주소"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">판매 방식 (선택)</label>
            <select
              value={storeMethod}
              onChange={(e) =>
                setStoreMethod((e.target.value as '수동' | '자동' | '반자동') || '')
              }
              className="px-3 py-2 border border-slate-300 rounded-md text-sm"
            >
              <option value="">선택 안 함</option>
              <option value="수동">수동</option>
              <option value="자동">자동</option>
              <option value="반자동">반자동</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={addWinningStore.isPending}
            className="px-4 py-2 bg-slate-900 text-white rounded-md font-medium hover:bg-slate-800 disabled:opacity-50"
          >
            {addWinningStore.isPending ? '저장 중…' : '당첨 판매점 저장'}
          </button>
        </form>
      </section>
    </div>
  )
}
