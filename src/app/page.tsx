import Link from 'next/link'

export default function Home() {
  return (
    <div className="space-y-8">
      <header className="text-center py-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">로또 분석 플랫폼</h1>
        <p className="text-lg text-slate-600">데이터 기반 로또 번호 분석 및 예측</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          href="/history"
          className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">히스토리</h2>
          <p className="text-slate-600">과거 당첨 번호를 확인하고 검색합니다.</p>
        </Link>

        <Link
          href="/analysis"
          className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">패턴분석</h2>
          <p className="text-slate-600">번호 패턴과 통계를 분석합니다.</p>
        </Link>

        <Link
          href="/prediction"
          className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">예상번호</h2>
          <p className="text-slate-600">AI 기반 예상 번호를 생성합니다.</p>
        </Link>

        <Link
          href="/generator"
          className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">랜덤생성</h2>
          <p className="text-slate-600">필터를 적용한 랜덤 번호를 생성합니다.</p>
        </Link>

        <Link
          href="/simulation"
          className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">타임머신</h2>
          <p className="text-slate-600">과거 데이터로 전략을 시뮬레이션합니다.</p>
        </Link>
      </div>
    </div>
  )
}
