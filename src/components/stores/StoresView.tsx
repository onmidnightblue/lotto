'use client'

import { useState, useCallback, useEffect } from 'react'
import { trpc } from '@/components/TrpcProvider'

type Tab = 'nationwide' | 'location'

const REGION_ORDER = [
  '서울',
  '경기',
  '부산',
  '대구',
  '인천',
  '대전',
  '광주',
  '울산',
  '경남',
  '경북',
  '충남',
  '전남',
  '전북',
  '충북',
  '강원',
  '제주',
  '세종',
]

function sortRegions(regions: string[]): string[] {
  const orderMap = new Map(REGION_ORDER.map((r, i) => [r, i]))
  return [...regions].sort((a, b) => {
    const ia = orderMap.get(a) ?? 999
    const ib = orderMap.get(b) ?? 999
    return ia - ib
  })
}

export default function StoresView() {
  const [tab, setTab] = useState<Tab>('nationwide')
  const [locationError, setLocationError] = useState<string | null>(null)

  const { data: regionList } = trpc.stores.regionList.useQuery(undefined, { initialData: [] })
  const sortedRegions = sortRegions(regionList ?? [])

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt' | null>(null)
  const [radiusSortBy, setRadiusSortBy] = useState<'distance' | 'wins'>('distance')
  const [nationwideRegion, setNationwideRegion] = useState('')
  const [nationwidePage, setNationwidePage] = useState(1)

  const NATIONWIDE_PAGE_SIZE = 50

  const radiusQuery = trpc.stores.byRadius.useQuery(
    coords
      ? { latitude: coords.lat, longitude: coords.lng, radiusKm: 10, sortBy: radiusSortBy }
      : { latitude: 0, longitude: 0, radiusKm: 10, sortBy: radiusSortBy },
    { enabled: tab === 'location' && coords !== null }
  )
  const nationwideQuery = trpc.stores.nationwideRank.useQuery(
    { limit: NATIONWIDE_PAGE_SIZE, page: nationwidePage, region: nationwideRegion || undefined },
    { enabled: tab === 'nationwide' }
  )
  const nationwideTotal = nationwideQuery.data?.total ?? 0
  const nationwideTotalPages = Math.max(1, Math.ceil(nationwideTotal / NATIONWIDE_PAGE_SIZE))

  useEffect(() => {
    setNationwidePage(1)
  }, [nationwideRegion])

  const getLocation = useCallback(() => {
    setLocationError(null)
    if (!navigator.geolocation) {
      setLocationError('이 브라우저는 위치 기능을 지원하지 않습니다.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      },
      () => {
        setLocationError('위치를 가져올 수 없습니다. 권한을 허용했는지 확인해주세요.')
      }
    )
  }, [])

  // 내 주변 10km 탭에서 위치 권한 확인 (이미 동의한 경우 바로 좌표 요청)
  useEffect(() => {
    if (tab !== 'location') return
    if (!navigator.permissions?.query) {
      setLocationPermission('prompt')
      return
    }
    navigator.permissions.query({ name: 'geolocation' }).then(
      (result) => {
        const state = result.state as 'granted' | 'denied' | 'prompt'
        setLocationPermission(state)
        if (state === 'granted' && !coords) getLocation()
      },
      () => setLocationPermission('prompt')
    )
  }, [tab, getLocation, coords])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab('nationwide')}
          className={`px-4 py-2 rounded-md font-medium ${
            tab === 'nationwide' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          전국 순위
        </button>
        <button
          type="button"
          onClick={() => setTab('location')}
          className={`px-4 py-2 rounded-md font-medium ${
            tab === 'location' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          내 주변 10km
        </button>
      </div>

      {tab === 'location' && (
        <div className="bg-white rounded-lg shadow p-6">
          {coords ? (
            <>
              <p className="text-slate-600 text-sm mb-3">
                현재 위치를 기반으로 반경 10km 이내 역대 1·2등 당첨 판매점을 표시합니다.
              </p>
              <div className="mb-3 flex gap-2">
                <span className="text-sm text-slate-600">정렬:</span>
                <button
                  type="button"
                  onClick={() => setRadiusSortBy('distance')}
                  className={`px-3 py-1.5 rounded text-sm font-medium ${
                    radiusSortBy === 'distance' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  가까운순
                </button>
                <button
                  type="button"
                  onClick={() => setRadiusSortBy('wins')}
                  className={`px-3 py-1.5 rounded text-sm font-medium ${
                    radiusSortBy === 'wins' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  당첨자순
                </button>
              </div>
            </>
          ) : locationPermission === 'granted' ? (
              <p className="text-slate-600 text-sm mb-3">위치를 불러오는 중...</p>
          ) : (
            <>
              <p className="text-slate-600 text-sm mb-3">
                위치 제공에 동의하시면 반경 10km 내 역대 1·2등 당첨 판매점 리스트를 확인할 수 있습니다.
              </p>
              <button
                type="button"
                onClick={getLocation}
                className="px-4 py-2 bg-slate-900 text-white rounded-md font-medium hover:bg-slate-800"
              >
                위치 허용하고 보기
              </button>
            </>
          )}
          {locationError && <p className="mt-2 text-red-600 text-sm">{locationError}</p>}
          {radiusQuery.data && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">검색 결과 ({radiusQuery.data.length}곳)</h3>
              {radiusQuery.data.length === 0 ? (
                <p className="text-slate-500">반경 10km 내 당첨 판매점이 없습니다.</p>
              ) : (
                <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {radiusQuery.data.map((s, i) => (
                    <li
                      key={`${s.round}-${s.rnum}-${i}`}
                      className="p-3 rounded-lg border border-slate-100 bg-slate-50/50"
                    >
                      <div className="font-medium">{s.store_name}</div>
                      <div className="text-sm text-slate-600">{s.full_address}</div>
                      <div className="text-xs text-slate-400">
                        {s.region ?? '-'} · {s.distanceKm.toFixed(1)}km · 1·2등 당첨 {s.winCount}회
                      </div>
                      {(s.store_tel || s.store_status) && (
                        <div className="text-xs text-slate-500 mt-1">
                          {s.store_tel && <span>전화: {s.store_tel}</span>}
                          {s.store_tel && s.store_status && ' · '}
                          {s.store_status && (
                            <span>
                              {s.store_status === '1' || s.store_status === 1
                                ? '영업중'
                                : s.store_status === '3' || s.store_status === 3
                                  ? '폐업'
                                  : s.store_status}
                            </span>
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {radiusQuery.isLoading && <p className="mt-4 text-slate-500">검색 중...</p>}
        </div>
      )}

      {tab === 'nationwide' && (
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-slate-600 text-sm mb-3">
            역대 1·2등을 가장 많이 배출한 판매점 순위입니다.
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              type="button"
              onClick={() => setNationwideRegion('')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                !nationwideRegion ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              전체
            </button>
            {sortedRegions.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setNationwideRegion(r)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                  nationwideRegion === r ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          {nationwideQuery.data?.items && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2">순위</th>
                      <th className="text-left py-2">판매점명</th>
                      <th className="text-left py-2">주소</th>
                      <th className="text-left py-2">시/도</th>
                      <th className="text-right py-2">1·2등 횟수</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nationwideQuery.data.items.map((row, i) => (
                      <tr key={i} className="border-b border-slate-100">
                        <td className="py-2 font-medium">
                          {(nationwidePage - 1) * NATIONWIDE_PAGE_SIZE + i + 1}
                        </td>
                        <td className="py-2">{row.store_name}</td>
                        <td className="py-2 text-slate-600">{row.full_address ?? '-'}</td>
                        <td className="py-2 text-slate-600">{row.region ?? '-'}</td>
                        <td className="py-2 text-right font-medium">{row.count}회</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {nationwideTotalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-200 pt-4 mt-4">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setNationwidePage(1)}
                      disabled={nationwidePage === 1}
                      className="px-3 py-1 text-sm border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      첫 페이지
                    </button>
                    <button
                      type="button"
                      onClick={() => setNationwidePage((p) => Math.max(1, p - 1))}
                      disabled={nationwidePage === 1}
                      className="px-3 py-1 text-sm border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      이전
                    </button>
                  </div>
                  <div className="text-sm text-slate-600">
                    {nationwidePage} / {nationwideTotalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setNationwidePage((p) => Math.min(nationwideTotalPages, p + 1))}
                      disabled={nationwidePage === nationwideTotalPages}
                      className="px-3 py-1 text-sm border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      다음
                    </button>
                    <button
                      type="button"
                      onClick={() => setNationwidePage(nationwideTotalPages)}
                      disabled={nationwidePage === nationwideTotalPages}
                      className="px-3 py-1 text-sm border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      마지막 페이지
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
          {nationwideQuery.isLoading && <p className="text-slate-500">로딩 중...</p>}
        </div>
      )}
    </div>
  )
}
