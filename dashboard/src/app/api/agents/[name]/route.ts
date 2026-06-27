import { NextRequest, NextResponse } from 'next/server'
import { getAgent, updateAgent } from '@/lib/github'

export async function GET(_: NextRequest, { params }: { params: { name: string } }) {
  try {
    const agent = await getAgent(params.name)
    return NextResponse.json(agent)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 404 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { name: string } }) {
  try {
    const body = await req.json() as { content?: string; sha?: string }
    if (!body.content || !body.sha) {
      return NextResponse.json({ error: 'content and sha are required' }, { status: 400 })
    }
    const result = await updateAgent(params.name, body.content, body.sha)
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
