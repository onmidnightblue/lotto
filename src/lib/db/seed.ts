import { readFileSync } from 'fs'
import { join } from 'path'
import { db } from './client'
import { lottoWinResult } from './schema'

async function seed() {
  try {
    console.log('🌱 Starting database seed...')

    // 1. 파일 경로 찾기
    const rootPath = join(process.cwd(), 'lotto_data.csv')
    const dataPath = join(process.cwd(), 'src/lib/db/data/lotto_data.csv')
    let csvPath = ''
    
    try {
      readFileSync(rootPath, 'utf-8'); csvPath = rootPath;
    } catch {
      csvPath = dataPath;
    }
    
    console.log(`📖 Reading CSV file from: ${csvPath}`)
    const fileContent = readFileSync(csvPath, 'utf-8')

    // 2. CSV 파싱 로직
    const lines = fileContent.split('\n').filter((line) => line.trim() !== '')
    const header = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
    
    // 컬럼 인덱스 매핑 (사용자님 CSV 헤더 기준)
    const idx = {
      round: header.indexOf('Round'),
      date: header.indexOf('Date'),
      num1: header.indexOf('Num1'),
      bonus: header.indexOf('Bonus'),
      prize: header.indexOf('1st prize winning amount'),
      winners: header.indexOf('1st place winners')
    }

    const insertData = lines.slice(1).map((line, i) => {
      // 따옴표 포함된 숫자(금액) 처리를 위한 간단한 split 로직
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
      
      if (values.length < 10) return null // 유효하지 않은 줄 스킵

      // 번호 6개 묶기
      const numbers = [
        parseInt(values[idx.num1]),
        parseInt(values[idx.num1 + 1]),
        parseInt(values[idx.num1 + 2]),
        parseInt(values[idx.num1 + 3]),
        parseInt(values[idx.num1 + 4]),
        parseInt(values[idx.num1 + 5]),
      ]

      return {
        id: parseInt(values[idx.round]), // Round 컬럼 사용
        draw_date: new Date(values[idx.date]), // 수정 완료된 YYYY-MM-DD 사용
        numbers: numbers,
        bonus: parseInt(values[idx.bonus]),
        prize_amount: parseInt(values[idx.prize]) || 0,
        winner_count: parseInt(values[idx.winners]) || 0,
      }
    }).filter(Boolean) as any[]

    console.log(`📊 Total records to insert: ${insertData.length}`)

    // 3. 기존 데이터 삭제 (중복 방지용 - 선택사항)
    // await db.delete(lottoWinResult)

    // 4. 배치 삽입 (Drizzle 문법)
    const batchSize = 100
    for (let i = 0; i < insertData.length; i += batchSize) {
      const batch = insertData.slice(i, i + batchSize)
      await db.insert(lottoWinResult).values(batch).onConflictDoUpdate({
        target: lottoWinResult.id,
        set: { draw_date: new Date() } // 이미 있으면 업데이트 (오류 방지)
      })
      console.log(`   Inserted ${i + batch.length}/${insertData.length}...`)
    }

    console.log('✨ Seed complete!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    process.exit(1)
  }
}

seed()