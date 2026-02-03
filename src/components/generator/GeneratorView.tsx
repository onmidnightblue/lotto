'use client'

import { useState, useEffect } from 'react'
import { trpc } from '@/components/TrpcProvider'
import { getBallColorClass } from '@/lib/utils/ballColors'

type GeneratedNumberSet = {
  id: string
  numbers: number[]
  mode: 'preset' | 'custom'
  preset?: 'balanced' | 'aggressive' | 'defensive'
  customOptions?: {
    includeNumbers?: number[]
    excludeNumbers?: number[]
    oddEven?: [number, number]
    numberRanges?: number[]
    sumRange?: [number, number]
  }
  createdAt: Date
  lastSeenRounds?: Map<number, number> // number -> roundId
  pairNumbers?: number[] // 짝꿍 번호 목록
}

export default function GeneratorView() {
  const [mode, setMode] = useState<'preset' | 'custom'>('preset')
  const [preset, setPreset] = useState<'balanced' | 'aggressive' | 'defensive'>('balanced')
  
  // 세밀한조절 옵션
  const [includeNumbers, setIncludeNumbers] = useState<string>('')
  const [excludeNumbers, setExcludeNumbers] = useState<string>('')
  const [oddCount, setOddCount] = useState<number>(3)
  const [numberRanges, setNumberRanges] = useState<number[]>([1, 2, 3, 4, 5])
  const [sumMin, setSumMin] = useState<number>(80)
  const [sumMax, setSumMax] = useState<number>(200)
  
  const [generatedSets, setGeneratedSets] = useState<GeneratedNumberSet[]>([])
  const [copyToast, setCopyToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    if (!copyToast) return
    const t = setTimeout(() => setCopyToast(null), 3000)
    return () => clearTimeout(t)
  }, [copyToast])

  const generatePreset = trpc.generator.generatePreset.useMutation()
  const generateCustom = trpc.generator.generateCustom.useMutation()
  const getLastSeenRounds = trpc.generator.getLastSeenRounds.useQuery
  const checkPairNumbers = trpc.generator.checkPairNumbers.useQuery

  const parseNumbers = (input: string): number[] => {
    return input
      .split(/[,\s]+/)
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n) && n >= 1 && n <= 45)
  }

  const handleGenerate = async () => {
    try {
      let result: number[] = []
      let customOptions: GeneratedNumberSet['customOptions'] | undefined

      if (mode === 'preset') {
        result = await generatePreset.mutateAsync({ preset })
      } else {
        const include = parseNumbers(includeNumbers)
        const exclude = parseNumbers(excludeNumbers)
        
        const evenCount = 6 - oddCount
        
        customOptions = {
          includeNumbers: include.length > 0 ? include.slice(0, 3) : undefined,
          excludeNumbers: exclude.length > 0 ? exclude.slice(0, 5) : undefined,
          oddEven: [oddCount, evenCount],
          numberRanges: numberRanges.length > 0 ? numberRanges : undefined,
          sumRange: [sumMin, sumMax],
        }
        
        result = await generateCustom.mutateAsync({
          includeNumbers: customOptions.includeNumbers,
          excludeNumbers: customOptions.excludeNumbers,
          oddEven: customOptions.oddEven,
          numberRanges: customOptions.numberRanges,
          sumRange: customOptions.sumRange,
        })
      }

      // 새 생성 세트 추가
      const newSet: GeneratedNumberSet = {
        id: Date.now().toString(),
        numbers: result,
        mode,
        preset: mode === 'preset' ? preset : undefined,
        customOptions: mode === 'custom' ? customOptions : undefined,
        createdAt: new Date(),
      }

      setGeneratedSets([newSet, ...generatedSets])
    } catch (error: any) {
      console.error('번호 생성 실패:', error)
      const errorMessage = error?.message || error?.toString() || '알 수 없는 오류'
      alert(`번호 생성에 실패했습니다: ${errorMessage}`)
    }
  }

  const handleDelete = (id: string) => {
    setGeneratedSets(generatedSets.filter(set => set.id !== id))
  }

  const presetLabels: Record<'balanced' | 'aggressive' | 'defensive', string> = {
    balanced: '균형형',
    aggressive: '대세형',
    defensive: '낭만형',
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setMode('preset')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              mode === 'preset'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            빠른조합
          </button>
          <button
            onClick={() => setMode('custom')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              mode === 'custom'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            세밀한조절
          </button>
        </div>

        {mode === 'preset' ? (
          <div className="space-y-4">
            <div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPreset('balanced')}
                  className={`p-4 rounded-lg border-2 transition-all flex flex-col items-start h-full ${
                    preset === 'balanced'
                      ? 'bg-slate-50 text-slate-700 border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-semibold mb-2 pb-2 border-b border-slate-200 w-full">균형형</div>
                  <ul className="text-xs space-y-1 list-disc list-outside pl-4 text-left">
                    <li>최근 5주 이내 출현 번호 3개</li>
                    <li>10주 이상 미출현 번호 3개</li>
                    <li>총합 100~175 (100 미만이면 미출현 번호 중 큰 수)</li>
                    <li>홀짝 3:3</li>
                    <li>번호대 3개 이상 (같은 번호대 최대 3개)</li>
                    <li>끝수 합 15~35</li>
                  </ul>
                </button>
                <button
                  type="button"
                  onClick={() => setPreset('aggressive')}
                  className={`p-4 rounded-lg border-2 transition-all flex flex-col items-start h-full ${
                    preset === 'aggressive'
                      ? 'bg-slate-50 text-slate-700 border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-semibold mb-2 pb-2 border-b border-slate-200 w-full">대세형</div>
                  <ul className="text-xs space-y-1 list-disc list-outside pl-4 text-left">
                    <li>최근 15주 내 가장 많이 나온 번호 2개</li>
                    <li>가장 많이 나온 번호의 궁합 번호 2개</li>
                    <li>직전 회차 번호 1개</li>
                    <li>나머지는 출현 빈도 높은 상위 번호로 구성</li>
                    <li>홀짝 비율: 2:4, 3:3, 4:2</li>
                  </ul>
                </button>
                <button
                  type="button"
                  onClick={() => setPreset('defensive')}
                  className={`p-4 rounded-lg border-2 transition-all flex flex-col items-start h-full ${
                    preset === 'defensive'
                      ? 'bg-slate-50 text-slate-700 border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-semibold mb-2 pb-2 border-b border-slate-200 w-full">낭만형</div>
                  <ul className="text-xs space-y-1 list-disc list-outside pl-4 text-left">
                    <li>가장 오래 나오지 않은 번호 2개</li>
                    <li>가장 오래 나오지 않은 번호의 궁합 번호 2개</li>
                    <li>최근 5주 내 번호 1개</li>
                    <li>홀짝 비율: 2:4, 3:3, 4:2</li>
                    <li>끝수 같은 숫자 최대 2개</li>
                  </ul>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                포함 번호 (최대 3개, 쉼표로 구분):
              </label>
              <input
                type="text"
                value={includeNumbers}
                onChange={(e) => setIncludeNumbers(e.target.value)}
                placeholder="1, 5, 10"
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                제외 번호 (최대 5개, 쉼표로 구분):
              </label>
              <input
                type="text"
                value={excludeNumbers}
                onChange={(e) => setExcludeNumbers(e.target.value)}
                placeholder="13, 27"
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">홀짝 비율:</label>
              <div className="flex flex-wrap gap-2">
                {[0, 1, 2, 3, 4, 5, 6].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setOddCount(count)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      oddCount === count
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    홀수 {count}개 (짝수 {6 - count}개)
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">포함할 번호대:</label>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((range) => {
                  const rangeStart = (range - 1) * 10 + 1
                  const rangeEnd = range === 5 ? 45 : range * 10
                  const isIncluded = numberRanges.includes(range)
                  const isRequired = parseNumbers(includeNumbers).some(
                    num => num >= rangeStart && num <= rangeEnd
                  )
                  
                  return (
                    <label
                      key={range}
                      className={`flex items-center gap-2 px-3 py-2 border rounded-md cursor-pointer ${
                        isIncluded
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      } ${isRequired ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={isIncluded}
                        onChange={(e) => {
                          if (isRequired) return
                          if (e.target.checked) {
                            setNumberRanges([...numberRanges, range])
                          } else {
                            setNumberRanges(numberRanges.filter(r => r !== range))
                          }
                        }}
                        disabled={isRequired}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">
                        {rangeStart}-{rangeEnd}
                      </span>
                    </label>
                  )
                })}
              </div>
              {parseNumbers(includeNumbers).length > 0 && (
                <p className="text-xs text-slate-500 mt-2">
                  * 필수 포함 번호가 있는 번호대는 자동으로 선택되며 해제할 수 없습니다.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">합 범위:</label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  value={sumMin}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 80
                    setSumMin(val)
                    if (val > sumMax) setSumMax(val)
                  }}
                  min={80}
                  max={200}
                  className="w-24 px-2 py-1 border border-slate-300 rounded-md text-sm"
                />
                <span className="text-sm">~</span>
                <input
                  type="number"
                  value={sumMax}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 200
                    setSumMax(val)
                    if (val < sumMin) setSumMin(val)
                  }}
                  min={80}
                  max={200}
                  className="w-24 px-2 py-1 border border-slate-300 rounded-md text-sm"
                />
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={generatePreset.isPending || generateCustom.isPending}
          className="mt-6 w-full px-6 py-3 bg-slate-900 text-white rounded-md font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generatePreset.isPending || generateCustom.isPending ? '생성 중...' : '번호 생성'}
        </button>
      </div>

      {generatedSets.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              생성된 번호 목록 <span className="text-sm font-normal text-slate-500">{generatedSets.length}개</span>
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const text = generatedSets
                    .map((set) => set.numbers.join(' '))
                    .join('\n')
                  navigator.clipboard.writeText(text).then(
                    () => setCopyToast({ message: '번호 목록이 클립보드에 복사되었습니다.', type: 'success' }),
                    () => setCopyToast({ message: '복사에 실패했습니다.', type: 'error' })
                  )
                }}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
              >
                복사
              </button>
              <button
                type="button"
                onClick={() => setGeneratedSets([])}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
              >
                모두 삭제
              </button>
            </div>
          </div>
          <div className="space-y-4">
            {generatedSets.map((set) => (
              <GeneratedNumberSetItem
                key={set.id}
                set={set}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}

      {copyToast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-in fade-in duration-200"
          style={{
            backgroundColor: copyToast.type === 'success' ? '#0f766e' : '#b91c1c',
            color: '#fff',
          }}
          role="status"
        >
          {copyToast.message}
        </div>
      )}
    </div>
  )
}

function GeneratedNumberSetItem({
  set,
  onDelete,
}: {
  set: GeneratedNumberSet
  onDelete: (id: string) => void
}) {
  const lastSeenQuery = trpc.generator.getLastSeenRounds.useQuery(
    { numbers: set.numbers },
    { enabled: set.numbers.length > 0 }
  )
  const pairQuery = trpc.generator.checkPairNumbers.useQuery(
    { numbers: set.numbers },
    { enabled: set.mode === 'preset' && set.numbers.length > 0 }
  )

  const lastSeenMap = new Map<number, number>()
  const latestRoundId = lastSeenQuery.data?.latestRoundId || null
  if (lastSeenQuery.data?.rounds) {
    lastSeenQuery.data.rounds.forEach(({ number, roundId }: { number: number; roundId: number }) => {
      lastSeenMap.set(number, roundId)
    })
  }

  // 각 번호의 짝꿍 번호를 Map으로 저장
  // 서버에서 이미 생성된 번호들 중에서만 짝꿍을 찾아서 반환하므로 그대로 사용
  const pairMap = new Map<number, number>()
  if (pairQuery.data) {
    pairQuery.data.forEach(({ number, pairNumber }: { number: number; pairNumber: number }) => {
      pairMap.set(number, pairNumber)
    })
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date)
  }

  const presetLabels: Record<'balanced' | 'aggressive' | 'defensive', string> = {
    balanced: '균형형',
    aggressive: '대세형',
    defensive: '낭만형',
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 relative">
      <button
        onClick={() => onDelete(set.id)}
        className="absolute top-4 right-4 w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
        aria-label="삭제"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="pr-8">
        {/* 헤더 정보 */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-600">
            {set.mode === 'preset' ? '빠른조합' : '세밀한조절'}
          </span>
          {set.mode === 'preset' && set.preset && (
            <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 font-medium">
              {presetLabels[set.preset]}
            </span>
          )}
          <span className="text-xs text-slate-500">
            {formatTime(set.createdAt)}
          </span>
        </div>

        {/* 번호 표시 */}
        <div className="flex gap-3 flex-wrap mb-4">
          {set.numbers.map((num) => {
            const pairNumber = pairMap.get(num)
            const lastSeenRound = lastSeenMap.get(num)
            
            return (
              <div key={num} className="flex flex-col items-center gap-1">
                <div className="relative">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold ${getBallColorClass(num)}`}
                  >
                    {num}
                  </div>
                  {pairNumber && (
                    <span className="absolute -top-1 -right-1 text-[10px] px-1 py-0.5 rounded-full border border-slate-300 bg-white text-slate-700 font-medium">
                      ♥︎{pairNumber}
                    </span>
                  )}
                </div>
                {lastSeenRound && (
                  <div className="text-xs text-slate-500 text-center">
                    {lastSeenRound}회
                    {latestRoundId && lastSeenRound === latestRoundId && (
                      <div className="text-[10px] text-slate-400 mt-0.5">직전</div>
                    )}
                  </div>
                )}
                {!lastSeenRound && (
                  <div className="text-xs text-slate-400">
                    미출현
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* 통계 정보 */}
        <div className="mt-6 pt-4 border-t border-slate-200 text-sm text-slate-600">
          <div className="flex flex-wrap gap-4" style={{ gap: '1rem' }}>
            {set.mode === 'custom' && set.customOptions ? (
              <>
                <div>
                  총합: {set.numbers.reduce((a, b) => a + b, 0)}
                  {set.customOptions.sumRange && (
                    <span className="text-slate-400 ml-1">
                      (범위 {set.customOptions.sumRange[0]}~{set.customOptions.sumRange[1]})
                    </span>
                  )}
                </div>
                <div>
                  홀짝: {set.customOptions.oddEven?.[0] || set.numbers.filter(n => n % 2 === 1).length}:
                  {set.customOptions.oddEven?.[1] || set.numbers.filter(n => n % 2 === 0).length}
                </div>
                {set.customOptions.includeNumbers && set.customOptions.includeNumbers.length > 0 && (
                  <div>포함: {set.customOptions.includeNumbers.join(', ')}</div>
                )}
                {(set.customOptions.excludeNumbers && set.customOptions.excludeNumbers.length > 0) ||
                (set.customOptions.numberRanges && set.customOptions.numberRanges.length < 5) ? (
                  <div>
                    제외:{' '}
                    {[
                      ...(set.customOptions.excludeNumbers || []),
                      ...(set.customOptions.numberRanges && set.customOptions.numberRanges.length < 5
                        ? [1, 2, 3, 4, 5]
                            .filter(r => !set.customOptions!.numberRanges!.includes(r))
                            .map(r => {
                              const start = (r - 1) * 10 + 1
                              const end = r === 5 ? 45 : r * 10
                              return `${start}-${end}`
                            })
                        : []),
                    ].join(', ')}
                  </div>
                ) : null}
              </>
            ) : (
              <>
                <div>총합: {set.numbers.reduce((a, b) => a + b, 0)}</div>
                <div>
                  홀짝: {set.numbers.filter(n => n % 2 === 1).length}:
                  {set.numbers.filter(n => n % 2 === 0).length}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
