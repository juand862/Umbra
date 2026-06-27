import { NextRequest, NextResponse } from 'next/server'
import { createFile } from '@/lib/github'

export async function POST(req: NextRequest) {
  try {
    const { ep_id, hint } = (await req.json()) as { ep_id?: string; hint?: string }
    if (!ep_id || !/^EP\d{3}$/.test(ep_id)) {
      return NextResponse.json({ error: 'ep_id inválido (ej: EP002)' }, { status: 400 })
    }

    const slug = `${ep_id}_tbd`
    const today = new Date().toISOString().slice(0, 10)
    const hintLine = hint ? `\nhint: "${hint.replace(/"/g, '\\"')}"` : ''

    const meta = `ep_id: ${ep_id}\nslug: ${slug}\ntitle: ""\nstage: curador${hintLine}\nupdated: ${today}\n`

    await createFile(`episodes/${slug}/meta.yaml`, meta)

    return NextResponse.json({ slug })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
