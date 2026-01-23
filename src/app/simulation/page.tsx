import SimulationView from '@/components/simulation/SimulationView'

export const metadata = {
  title: '타임머신 · Lotto Analysis',
  description: '과거 데이터로 전략 시뮬레이션',
}

export default function SimulationPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">타임머신</h1>
        <p className="text-slate-600 mt-1">과거 데이터로 전략을 시뮬레이션합니다.</p>
      </header>
      <SimulationView />
    </div>
  )
}
