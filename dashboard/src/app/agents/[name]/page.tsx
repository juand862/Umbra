import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAgent } from '@/lib/github'
import { parseAgent } from '@/lib/parse-agent'
import AgentEditor from '@/components/AgentEditor'

const MODEL_BADGE: Record<string, string> = {
  'claude-sonnet-4-6': 'bg-violet-900/60 text-violet-300 border-violet-700',
  'claude-opus-4-8':   'bg-amber-900/60  text-amber-300  border-amber-700',
}

export default async function AgentPage({ params }: { params: { name: string } }) {
  let data: { content: string; sha: string }
  try {
    data = await getAgent(params.name)
  } catch {
    notFound()
  }

  const meta = parseAgent(data.content)

  return (
    <div className="max-w-3xl">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-200 text-sm mb-8 transition-colors"
      >
        ← Volver al dashboard
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-white">{meta.name}</h1>
        <span className={`text-xs px-2.5 py-1 rounded-full border font-mono ${MODEL_BADGE[meta.model] ?? 'bg-slate-700 text-slate-300 border-slate-600'}`}>
          {meta.model}
        </span>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 mb-6 space-y-3 text-sm">
        <Row label="Tools">
          <div className="flex flex-wrap gap-1.5">
            {meta.tools.split(',').map(t => t.trim()).filter(Boolean).map(tool => (
              <span key={tool} className="bg-slate-800 border border-slate-700 text-slate-300 px-2 py-0.5 rounded-md text-xs">
                {tool}
              </span>
            ))}
          </div>
        </Row>
        <Row label="Descripción">
          <span className="text-slate-300">{meta.description}</span>
        </Row>
      </div>

      <AgentEditor
        name={params.name}
        initialContent={data.content}
        sha={data.sha}
      />
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <span className="text-slate-500 w-24 shrink-0">{label}</span>
      <div className="flex-1">{children}</div>
    </div>
  )
}
