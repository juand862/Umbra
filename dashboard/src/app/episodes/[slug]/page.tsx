export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getEpisodeMetaWithSha, getEpisodeFile } from '@/lib/github'
import PipelineView from '@/components/PipelineView'

function parseMeta(yaml: string): Record<string, string> {
  const result: Record<string, string> = {}
  for (const line of yaml.split('\n')) {
    const m = line.match(/^(\w+):\s*(.*)$/)
    if (m) result[m[1]] = m[2].trim().replace(/^"|"$/g, '')
  }
  return result
}

const STAGE_ARTIFACT: Record<string, { file: string; label: string }> = {
  dossier:   { file: '00_dossier.md',  label: 'Dossier (A1)' },
  guion:     { file: '01_guion.md',    label: 'Guion (A2)' },
  h1:        { file: '01_guion.md',    label: 'Guion (A2) — pendiente H1' },
  narracion: { file: '01_guion.md',    label: 'Guion aprobado' },
  visuales:  { file: '02_shotlist.md', label: 'Shotlist (A4)' },
  ensamble:  { file: '02_shotlist.md', label: 'Shotlist' },
  empaque:   { file: '05_empaque.md',  label: 'Empaque (A6)' },
  a0:        { file: '05_empaque.md',  label: 'Empaque — pendiente A0' },
}

export default async function EpisodePage({ params }: { params: { slug: string } }) {
  const meta = await getEpisodeMetaWithSha(params.slug)
  if (!meta) notFound()

  const p = parseMeta(meta.content)
  const stage = p.stage ?? ''

  const artifactDef = STAGE_ARTIFACT[stage] ?? null
  const artifact = artifactDef
    ? await getEpisodeFile(params.slug, artifactDef.file)
    : null

  return (
    <div className="max-w-4xl">
      <Link href="/" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-200 text-sm mb-8 transition-colors">
        ← Volver al dashboard
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white font-mono mb-1">{params.slug}</h1>
        <div className="flex gap-4 text-sm text-slate-500">
          {p.ep_id   && <span>ID: <span className="text-slate-300">{p.ep_id}</span></span>}
          {p.updated && <span>Actualizado: <span className="text-slate-300">{p.updated}</span></span>}
        </div>
      </div>

      <PipelineView
        slug={params.slug}
        currentStage={stage}
        h1Approved={p.h1_approved === 'true'}
        approvedByJD={p.approved_by === 'JD'}
        metaContent={meta.content}
        metaSha={meta.sha}
        artifact={artifact}
        artifactLabel={artifactDef?.label ?? null}
      />

      <div className="mt-8">
        <h2 className="text-xs uppercase tracking-widest text-slate-500 mb-3">meta.yaml</h2>
        <pre className="rounded-2xl border border-slate-800 bg-slate-900 p-5 text-xs font-mono text-slate-400 overflow-x-auto">{meta.content}</pre>
      </div>
    </div>
  )
}
