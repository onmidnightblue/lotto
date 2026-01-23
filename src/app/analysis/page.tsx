'use client'

import { useRef } from 'react'
import CooccurrenceFrequency from '@/components/analysis/CooccurrenceFrequency'
import PairAffinity from '@/components/analysis/PairAffinity'
import PairConflict from '@/components/analysis/PairConflict'
import MissingNumbers from '@/components/analysis/MissingNumbers'

export default function AnalysisPage() {
  const section3Ref = useRef<HTMLDivElement>(null)
  const section4Ref = useRef<HTMLDivElement>(null)
  const sectionAffinityRef = useRef<HTMLDivElement>(null)
  const sectionConflictRef = useRef<HTMLDivElement>(null)
  const sectionMissingRef = useRef<HTMLDivElement>(null)

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      const elementTop = ref.current.offsetTop
      const offset = 24 // sidenav 높이 + 여유 공간
      window.scrollTo({
        top: elementTop - offset,
        behavior: 'smooth',
      })
    }
  }

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Sidenav */}
      <aside className="hidden md:block w-48 flex-shrink-0 sticky top-6 h-fit">
        <nav className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">목차</h3>
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => scrollToSection(section3Ref)}
                className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
              >
                3종세트
              </button>
            </li>
            <li>
              <button
                onClick={() => scrollToSection(section4Ref)}
                className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
              >
                4종세트
              </button>
            </li>
            <li>
              <button
                onClick={() => scrollToSection(sectionAffinityRef)}
                className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
              >
                단짝
              </button>
            </li>
            <li>
              <button
                onClick={() => scrollToSection(sectionConflictRef)}
                className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
              >
                상극
              </button>
            </li>
            <li>
              <button
                onClick={() => scrollToSection(sectionMissingRef)}
                className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
              >
                휴식중
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 space-y-8">
        <header>
          <h1 className="text-3xl font-bold">패턴분석</h1>
          <p className="text-slate-600 mt-1">로또 번호의 패턴을 분석합니다.</p>
        </header>

        <section ref={section3Ref} className="scroll-mt-24">
          <CooccurrenceFrequency size="3" title="3종세트" />
        </section>

        <section ref={section4Ref} className="scroll-mt-24">
          <CooccurrenceFrequency size="4" title="4종세트" />
        </section>

        <section ref={sectionAffinityRef} className="scroll-mt-24">
          <PairAffinity />
        </section>

        <section ref={sectionConflictRef} className="scroll-mt-24">
          <PairConflict />
        </section>

        <section ref={sectionMissingRef} className="scroll-mt-24">
          <MissingNumbers />
        </section>
      </div>
    </div>
  )
}
