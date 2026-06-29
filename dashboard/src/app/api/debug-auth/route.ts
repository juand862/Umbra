import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  let token = null
  let tokenError = null

  try {
    token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  } catch (e: any) {
    tokenError = e.message
  }

  const cookies = Object.fromEntries(
    req.cookies.getAll().map(c => [c.name, c.value.slice(0, 20) + '…'])
  )

  const result = {
    env: {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? '⚠️ NO SET',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET
        ? `✓ SET (${process.env.NEXTAUTH_SECRET.length} chars)`
        : '⚠️ NOT SET',
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID
        ? `✓ SET (${process.env.GOOGLE_CLIENT_ID.slice(0, 12)}…)`
        : '⚠️ NOT SET',
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? '✓ SET' : '⚠️ NOT SET',
      VERCEL_URL: process.env.VERCEL_URL ?? 'not set',
      NODE_ENV: process.env.NODE_ENV,
    },
    token: token ? { email: token.email, name: token.name } : null,
    tokenError,
    cookies,
    verdict: token ? '✅ Autenticado' : '🔒 No autenticado — debería redirigir a /login',
  }

  return NextResponse.json(result, { status: 200 })
}
