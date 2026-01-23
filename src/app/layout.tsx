import './globals.css'
import TrpcProvider from '@/components/TrpcProvider'
import Navigation from '@/components/Navigation'

export const metadata = {
  title: 'Lotto Analysis',
  description: 'Lotto Analysis & Simulation Platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-gray-50 text-slate-900">
        <TrpcProvider>
          <Navigation />
          <main className="max-w-6xl mx-auto p-6">
            {children}
          </main>
        </TrpcProvider>
      </body>
    </html>
  )
}
