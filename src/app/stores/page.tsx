import StoresView from '@/components/stores/StoresView'

export const metadata = {
  title: '로또명당 · Lotto Analysis',
  description: '현재 위치 10km, 시/도 검색, 전국 1·2등 당첨 판매점',
}

export default function StoresPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">로또명당</h1>
        <p className="text-slate-600 mt-1">
          현재 위치 기준 반경 10km 내 역대 1·2등 배출점, 시/도 검색, 전국 순위를 확인하세요.
        </p>
      </header>
      <StoresView />
    </div>
  )
}
