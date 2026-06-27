import { NextRequest, NextResponse } from 'next/server'
import { getEpisodeMetaWithSha, updateEpisodeMeta } from '@/lib/github'

export async function GET(_: NextRequest, { params }: { params: { slug: string } }) {
  const meta = await getEpisodeMetaWithSha(params.slug)
  if (!meta) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json(meta)
}

export async function PUT(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const body = await req.json() as { content?: string; sha?: string }
    if (!body.content || !body.sha) {
      return NextResponse.json({ error: 'content and sha required' }, { status: 400 })
    }
    const result = await updateEpisodeMeta(params.slug, body.content, body.sha)
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
