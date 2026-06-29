'use client'

import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, Suspense } from 'react'

function LoginContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useSearchParams()
  const error = params.get('error')

  useEffect(() => {
    if (status === 'authenticated') router.replace('/')
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-500 text-sm">Verificando sesión…</div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-sm space-y-6 p-8 rounded-2xl border border-slate-800 bg-slate-900">
        <div className="text-center space-y-1">
          <span className="font-bold tracking-[0.3em] text-white text-xl">UMBRA</span>
          <p className="text-slate-400 text-sm">Panel de producción</p>
        </div>

        {error === 'AccessDenied' && (
          <div className="text-xs text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-4 py-3 text-center">
            Acceso denegado. Solo el administrador puede ingresar.
          </div>
        )}

        <button
          onClick={() => signIn('google', { callbackUrl: '/' })}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 hover:border-slate-600 transition-all text-sm text-slate-200 font-medium"
        >
          <GoogleIcon />
          Continuar con Google
        </button>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="text-slate-500 text-sm">Cargando…</div></div>}>
      <LoginContent />
    </Suspense>
  )
}
