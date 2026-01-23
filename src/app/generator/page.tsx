import GeneratorView from '@/components/generator/GeneratorView'

export const metadata = {
  title: '랜덤생성 · Lotto Analysis',
  description: '필터 기반 랜덤 번호 생성',
}

export default function GeneratorPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">랜덤생성</h1>
        <p className="text-slate-600 mt-1">필터를 적용하여 랜덤 번호를 생성합니다.</p>
      </header>
      <GeneratorView />
    </div>
  )
}
