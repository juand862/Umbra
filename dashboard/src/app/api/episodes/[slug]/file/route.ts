import { NextRequest, NextResponse } from 'next/server'
import { getEpisodeFile } from '@/lib/github'

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const name = req.nextUrl.searchParams.get('name')
  if (!name || !/^[\w.-]+\.md$/.test(name)) {
    return NextResponse.json({ error: 'invalid name' }, { status: 400 })
  }
  const content = await getEpisodeFile(params.slug, name)
  if (!content) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json({ content })
}
