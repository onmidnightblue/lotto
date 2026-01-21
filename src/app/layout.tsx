import './styles/globals.css'
import TrpcProvider from '@/components/TrpcProvider'

export const metadata = {
  title: 'Lotto Analysis',
  description: 'Lotto Analysis & Simulation Platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-slate-900">
        <main className="max-w-6xl mx-auto p-6">
          <TrpcProvider>{children}</TrpcProvider>
        </main>
      </body>
    </html>
  )
}
