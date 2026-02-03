import SimulationView from '@/components/simulation/SimulationView'

export const metadata = {
  title: '타임머신 · Lotto Analysis',
  description: '이 번호로 10년동안 샀다면? 시뮬레이션',
}

export default function SimulationPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">타임머신</h1>
        <p className="text-slate-600 mt-1">이 번호로 10년동안 샀다면? 과거 회차 기준 수익 시뮬레이션.</p>
      </header>
      <SimulationView />
    </div>
  )
}
