import { z } from 'zod'
import { router, publicProcedure } from '../trpc'
import { db } from '@/lib/db'
import { stores } from '@/lib/db/schema'
import { eq, sql, desc, and, isNotNull, inArray } from 'drizzle-orm'

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export const storesRouter = router({
  /** 반경 10km 내 1/2등 당첨 판매점 (위도/경도). 판매점별 당첨 횟수 집계, 정렬 옵션 */
  byRadius: publicProcedure
    .input(
      z.object({
        latitude: z.number(),
        longitude: z.number(),
        radiusKm: z.number().min(0.1).max(100).default(10),
        limit: z.number().min(1).max(500).default(100),
        sortBy: z.enum(['distance', 'wins']).default('distance'), // 가까운순 / 당첨자순
      })
    )
    .query(async ({ input }) => {
      const rows = await db
        .select()
        .from(stores)
        .where(
          and(
            inArray(stores.rank, [1, 2]),
            isNotNull(stores.latitude),
            isNotNull(stores.longitude)
          )
        )
      const withDist = rows
        .filter((r) => r.latitude != null && r.longitude != null)
        .map((r) => ({
          ...r,
          distanceKm: haversineKm(
            input.latitude,
            input.longitude,
            r.latitude!,
            r.longitude!
          ),
        }))
        .filter((r) => r.distanceKm <= input.radiusKm)

      // 판매점별 그룹 (store_id 또는 store_name+full_address+region)
      const byStore = new Map<
        string,
        {
          store_name: string
          full_address: string | null
          region: string | null
          store_tel: string | null
          store_status: string | null
          distanceKm: number
          winCount: number
          round: number
          rnum: number
        }
      >()
      for (const r of withDist) {
        const key = r.store_id ?? `${r.store_name}|${r.full_address ?? ''}|${r.region ?? ''}`
        const existing = byStore.get(key)
        if (!existing) {
          byStore.set(key, {
            store_name: r.store_name,
            full_address: r.full_address,
            region: r.region,
            store_tel: r.store_tel ?? null,
            store_status: r.store_status ?? null,
            distanceKm: r.distanceKm,
            winCount: 1,
            round: r.round,
            rnum: r.rnum,
          })
        } else {
          existing.winCount += 1
          if (r.distanceKm < existing.distanceKm) existing.distanceKm = r.distanceKm
        }
      }
      const list = Array.from(byStore.values())
      if (input.sortBy === 'wins') {
        list.sort((a, b) => b.winCount - a.winCount)
      } else {
        list.sort((a, b) => a.distanceKm - b.distanceKm)
      }
      return list.slice(0, input.limit)
    }),

  /** 시/도(region)별 1/2등 당첨 판매점 */
  byRegion: publicProcedure
    .input(
      z.object({
        region: z.string().min(1),
        limit: z.number().min(1).max(500).default(200),
      })
    )
    .query(async ({ input }) => {
      return await db
        .select()
        .from(stores)
        .where(eq(stores.region, input.region))
        .orderBy(desc(stores.round))
        .limit(input.limit)
    }),

  /** 시/도(region) 목록 (검색용) */
  regionList: publicProcedure.query(async () => {
    const rows = await db
      .selectDistinct({ region: stores.region })
      .from(stores)
      .where(isNotNull(stores.region))
    return rows
      .map((r) => r.region)
      .filter(Boolean)
      .sort() as string[]
  }),

  /** 전국 순위: 1/2등 배출 횟수 많은 판매점. store_id 같으면 같은 업체로 집계. region 있으면 해당 시/도만. 페이지네이션(50개씩) */
  nationwideRank: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(200).default(50),
        page: z.number().min(1).default(1),
        region: z.string().optional(), // '' 또는 없으면 전체
      })
    )
    .query(async ({ input }) => {
      const conditions = [inArray(stores.rank, [1, 2])]
      if (input.region && input.region.trim()) {
        conditions.push(eq(stores.region, input.region.trim()))
      }
      const groupKey = sql<string>`COALESCE(${stores.store_id}, ${stores.store_name} || '|' || COALESCE(${stores.full_address}, '') || '|' || COALESCE(${stores.region}, ''))`
      const offset = (input.page - 1) * input.limit

      const rows = await db
        .select({
          store_name: sql<string>`MAX(${stores.store_name})`.as('store_name'),
          full_address: sql<string | null>`MAX(${stores.full_address})`.as('full_address'),
          region: sql<string | null>`MAX(${stores.region})`.as('region'),
          count: sql<number>`count(*)::int`.as('count'),
        })
        .from(stores)
        .where(and(...conditions))
        .groupBy(groupKey)
        .orderBy(desc(sql`count(*)`))
        .limit(input.limit)
        .offset(offset)

      const grouped = db
        .select({ key: groupKey })
        .from(stores)
        .where(and(...conditions))
        .groupBy(groupKey)
        .as('g')
      const totalResult = await db
        .select({ total: sql<number>`count(*)::int`.as('total') })
        .from(grouped)
      const total = totalResult[0]?.total ?? 0

      return { items: rows, total }
    }),
})
