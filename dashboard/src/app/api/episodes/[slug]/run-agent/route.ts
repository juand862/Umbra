import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getAgent, getEpisodeFile, getEpisodeMetaWithSha, createFile, updateEpisodeMeta } from '@/lib/github'

export const maxDuration = 300

const AGENT_MAP: Record<string, {
  agentName: string
  model: string
  outputFile: string
  nextStage: string
  contextFiles: string[]
}> = {
  curador:   { agentName: 'curador',        model: 'claude-sonnet-4-6', outputFile: '00_dossier.md',  nextStage: 'dossier',   contextFiles: [] },
  dossier:   { agentName: 'guionista',      model: 'claude-opus-4-8',   outputFile: '01_guion.md',    nextStage: 'guion',     contextFiles: ['00_dossier.md'] },
  guion:     { agentName: 'guionista',      model: 'claude-opus-4-8',   outputFile: '01_guion.md',    nextStage: 'guion',     contextFiles: ['00_dossier.md'] },
  narracion: { agentName: 'director-visual',model: 'claude-sonnet-4-6', outputFile: '02_shotlist.md', nextStage: 'visuales',  contextFiles: ['01_guion.md'] },
  ensamble:  { agentName: 'empaquetador',   model: 'claude-sonnet-4-6', outputFile: '05_empaque.md',  nextStage: 'empaque',   contextFiles: ['00_dossier.md', '01_guion.md', '02_shotlist.md'] },
}

function parseAgentPrompt(content: string): string {
  // Strip YAML frontmatter
  const stripped = content.replace(/^---[\s\S]*?---\n/, '')
  return stripped.trim()
}

function upsertYaml(yaml: string, updates: Record<string, string>): string {
  let result = yaml
  for (const [key, value] of Object.entries(updates)) {
    const re = new RegExp(`^${key}:.*$`, 'm')
    if (re.test(result)) {
      result = result.replace(re, `${key}: ${value}`)
    } else {
      result = result.trimEnd() + `\n${key}: ${value}\n`
    }
  }
  return result
}

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY no configurada en Vercel. Ve a Settings → Environment Variables.' }, { status: 500 })
  if (!process.env.GITHUB_TOKEN) return NextResponse.json({ error: 'GITHUB_TOKEN no configurado en Vercel. Necesario para escribir artefactos al repo.' }, { status: 500 })

  const { stage } = await req.json() as { stage: string }
  const config = AGENT_MAP[stage]
  if (!config) return NextResponse.json({ error: `No hay agente para stage: ${stage}` }, { status: 400 })

  // Load agent system prompt
  let agentContent: string
  try {
    const { content } = await getAgent(config.agentName)
    agentContent = parseAgentPrompt(content)
  } catch {
    return NextResponse.json({ error: `No se pudo cargar el agente ${config.agentName}` }, { status: 500 })
  }

  // Load context files
  const contextParts: string[] = []
  for (const file of config.contextFiles) {
    const content = await getEpisodeFile(params.slug, file)
    if (content) contextParts.push(`### ${file}\n\n${content}`)
  }

  const userMessage = contextParts.length
    ? `Episodio: ${params.slug}\n\nArchivos de contexto:\n\n${contextParts.join('\n\n---\n\n')}\n\nEjecuta tu mandato para este episodio. Escribe únicamente el contenido del archivo de salida (${config.outputFile}), sin explicaciones adicionales.`
    : `Episodio: ${params.slug}\n\nEjecuta tu mandato. Escribe únicamente el contenido del archivo de salida (${config.outputFile}), sin explicaciones adicionales.`

  const client = new Anthropic({ apiKey })

  // Stream response to client, accumulate full text, then save
  const encoder = new TextEncoder()
  let fullText = ''

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = await client.messages.stream({
          model: config.model,
          max_tokens: 8192,
          system: agentContent,
          messages: [{ role: 'user', content: userMessage }],
        })

        for await (const chunk of anthropicStream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            const text = chunk.delta.text
            fullText += text
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
          }
        }

        // Save output file and update meta.yaml
        const today = new Date().toISOString().slice(0, 10)
        const outputPath = `episodes/${params.slug}/${config.outputFile}`

        // Try to get existing file sha for update, or create new
        const existing = await getEpisodeFile(params.slug, config.outputFile)
        if (existing === null) {
          await createFile(outputPath, fullText)
        } else {
          // Need sha to update — fetch via github lib
          const res = await fetch(
            `https://api.github.com/repos/${process.env.GITHUB_OWNER ?? 'juand862'}/${process.env.GITHUB_REPO ?? 'Umbra'}/contents/${outputPath}?ref=${process.env.GITHUB_BRANCH ?? 'main'}`,
            { headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json' } }
          )
          const data = await res.json() as { sha: string }
          const updateRes = await fetch(`https://api.github.com/repos/${process.env.GITHUB_OWNER ?? 'juand862'}/${process.env.GITHUB_REPO ?? 'Umbra'}/contents/${outputPath}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: `feat(${params.slug}): ${config.agentName} → ${config.outputFile}`,
              content: Buffer.from(fullText).toString('base64'),
              sha: data.sha,
              branch: process.env.GITHUB_BRANCH ?? 'main',
            }),
          })
          if (!updateRes.ok) throw new Error('Error actualizando archivo')
        }

        // Update meta.yaml
        const meta = await getEpisodeMetaWithSha(params.slug)
        if (meta) {
          const newMeta = upsertYaml(meta.content, { stage: config.nextStage, updated: today })
          await updateEpisodeMeta(params.slug, newMeta, meta.sha)
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, nextStage: config.nextStage })}\n\n`))
      } catch (e) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: String(e) })}\n\n`))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
