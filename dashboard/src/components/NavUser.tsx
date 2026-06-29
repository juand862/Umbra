'use client'

import { useSession, signOut } from 'next-auth/react'

export default function NavUser() {
  const { data: session } = useSession()
  if (!session) return null

  return (
    <div className="flex items-center gap-3 ml-auto">
      <span className="text-slate-500 text-xs hidden sm:block">{session.user?.email}</span>
      <button
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-1 rounded-lg transition-all"
      >
        Salir
      </button>
    </div>
  )
}
