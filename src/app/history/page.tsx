import HistorySearch from '@/components/history/HistorySearch'

export const metadata = {
  title: '히스토리 · Lotto Analysis',
  description: '로또 당첨 번호 히스토리',
}

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">히스토리</h1>
        <p className="text-slate-600 mt-1">과거 로또 당첨 번호를 검색하고 확인하세요.</p>
      </header>
      <HistorySearch />
    </div>
  )
}
