import Link from 'next/link'

export default function Home() {
  return (
    <div className="space-y-8">
      <header className="text-center py-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">로또 분석 플랫폼</h1>
        <p className="text-lg text-slate-600">데이터 기반 로또 번호 분석 및 예측</p>
      </header>

      <div className="flex flex-col gap-6 items-center">
        <Link
          href="/history"
          className="w-full max-w-md p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">히스토리</h2>
          <p className="text-slate-600">과거 당첨 번호를 확인하고 검색합니다.</p>
        </Link>

        <Link
          href="/analysis"
          className="w-full max-w-md p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">패턴분석</h2>
          <p className="text-slate-600">번호 패턴과 통계를 분석합니다.</p>
        </Link>

        <Link
          href="/generator"
          className="w-full max-w-md p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">랜덤생성</h2>
          <p className="text-slate-600">필터를 적용한 랜덤 번호를 생성합니다.</p>
        </Link>

        <Link
          href="/simulation"
          className="w-full max-w-md p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">타임머신</h2>
          <p className="text-slate-600">과거 데이터로 전략을 시뮬레이션합니다.</p>
        </Link>

        <Link
          href="/admin"
          className="w-full max-w-md p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">관리실</h2>
          <p className="text-slate-600">당첨 회차·등수별 당첨금·당첨 판매점을 입력합니다.</p>
        </Link>
      </div>
    </div>
  )
}
