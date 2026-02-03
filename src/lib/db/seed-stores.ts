/**
 * stores.csv → stores 테이블
 * PK = (round, rnum). 시드 전 DROP + CREATE. FK → prizes(round)
 */
import { readFileSync } from 'fs'
import { join } from 'path'
import { db, pgPool } from './client'
import { stores } from './schema'

const MIGRATION_SQL = `
DROP TABLE IF EXISTS stores;
CREATE TABLE stores (
  "round" integer NOT NULL REFERENCES prizes(round),
  rnum integer NOT NULL,
  store_name text NOT NULL,
  store_tel text,
  region text,
  address_part1 text,
  address_part2 text,
  address_part3 text,
  address_part4 text,
  full_address text,
  auto_win_type text,
  store_id text,
  store_status text,
  sell_lotto text,
  rank integer DEFAULT 1,
  latitude double precision,
  longitude double precision,
  PRIMARY KEY ("round", rnum)
);
`.trim()

const CSV_KEYS = [
  'rnum',
  'shpNm',
  'shpTelno',
  'region',
  'tm1ShpLctnAddr',
  'tm2ShpLctnAddr',
  'tm3ShpLctnAddr',
  'tm4ShpLctnAddr',
  'shpAddr',
  'atmtPsvYnTxt',
  'ltShpId',
  'slrOperSttsCd',
  'l645LtNtslYn',
  'wnShpRnk',
  'shpLat',
  'shpLot',
  'round',
] as const

function parseCell(raw: string): string {
  return raw?.trim().replace(/^"|"$/g, '') ?? ''
}

function parseNum(v: string): number | null {
  const n = parseInt(v, 10)
  return isNaN(n) ? null : n
}

function parseFloatVal(v: string): number | null {
  const n = parseFloat(v)
  return isNaN(n) ? null : n
}

async function seed() {
  const path = join(process.cwd(), 'src/lib/db/data/stores.csv')
  console.log('📖 Reading', path)
  const content = readFileSync(path, 'utf-8')
  const lines = content.split(/\r?\n/).filter((l) => l.trim())
  const header = lines[0].split(',').map((h) => parseCell(h))
  const colIndex: Record<string, number> = {}
  header.forEach((h, i) => {
    colIndex[h] = i
  })

  for (const key of CSV_KEYS) {
    if (colIndex[key] == null) {
      console.error('Missing column:', key, 'Header:', header)
      process.exit(1)
    }
  }

  const rows: Array<{
    round: number
    rnum: number
    store_name: string
    store_tel: string | null
    region: string | null
    address_part1: string | null
    address_part2: string | null
    address_part3: string | null
    address_part4: string | null
    full_address: string | null
    auto_win_type: string | null
    store_id: string | null
    store_status: string | null
    sell_lotto: string | null
    rank: number | null
    latitude: number | null
    longitude: number | null
  }> = []

  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(',').map((c) => parseCell(c))
    const get = (key: string) => vals[colIndex[key]] ?? ''

    const round = parseNum(get('round'))
    const rnum = parseNum(get('rnum'))
    const store_name = get('shpNm').trim()
    if (round == null || rnum == null || !store_name) continue

    rows.push({
      round,
      rnum,
      store_name,
      store_tel: get('shpTelno') || null,
      region: get('region') || null,
      address_part1: get('tm1ShpLctnAddr') || null,
      address_part2: get('tm2ShpLctnAddr') || null,
      address_part3: get('tm3ShpLctnAddr') || null,
      address_part4: get('tm4ShpLctnAddr') || null,
      full_address: get('shpAddr') || null,
      auto_win_type: get('atmtPsvYnTxt') || null,
      store_id: get('ltShpId') || null,
      store_status: get('slrOperSttsCd') || null,
      sell_lotto: get('l645LtNtslYn') || null,
      rank: parseNum(get('wnShpRnk')) ?? null,
      latitude: parseFloatVal(get('shpLat')) ?? null,
      longitude: parseFloatVal(get('shpLot')) ?? null,
    })
  }

  console.log('📊 Rows to insert:', rows.length)
  console.log('🔄 Ensuring table schema (DROP + CREATE)...')
  if (pgPool && typeof (pgPool as any).query === 'function') {
    await (pgPool as any).query(MIGRATION_SQL)
  } else {
    await db.delete(stores)
  }

  const batchSize = 500
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize)
    await db.insert(stores).values(batch)
    console.log('   Inserted', Math.min(i + batchSize, rows.length), '/', rows.length)
  }
  console.log('✨ Stores seed complete')
  process.exit(0)
}

seed().catch((e) => {
  console.error(e)
  process.exit(1)
})
