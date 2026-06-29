import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AuthProvider from '@/components/AuthProvider'
import NavUser from '@/components/NavUser'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'UMBRA — Dashboard',
  description: 'Panel de control del pipeline de producción UMBRA',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-slate-950 text-slate-100 min-h-screen`}>
        <AuthProvider>
          <nav className="border-b border-slate-800 px-8 py-4 flex items-center gap-3">
            <span className="font-bold tracking-[0.2em] text-white">UMBRA</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400 text-sm">dashboard</span>
            <NavUser />
          </nav>
          <main className="max-w-6xl mx-auto px-8 py-10">{children}</main>
        </AuthProvider>
      </body>
    </html>
  )
}
