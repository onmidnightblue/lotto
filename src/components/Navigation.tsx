'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/history', label: '히스토리' },
  { href: '/analysis', label: '패턴분석' },
  { href: '/prediction', label: '예상번호' },
  { href: '/generator', label: '랜덤생성' },
  { href: '/simulation', label: '타임머신' },
]

export default function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="border-b bg-white shadow-sm">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold text-slate-900 hover:text-slate-700">
            로또 분석
          </Link>
          <div className="flex space-x-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
