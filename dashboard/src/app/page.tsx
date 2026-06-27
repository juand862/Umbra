import Link from 'next/link'
import { listAgents, getAgent, listEpisodes, getEpisodeMeta } from '@/lib/github'
import { parseAgent } from '@/lib/parse-agent'

const MODEL_BADGE: Record<string, string> = {
  'claude-sonnet-4-6': 'bg-violet-900/60 text-violet-300 border-violet-700',
  'claude-opus-4-8':   'bg-amber-900/60  text-amber-300  border-amber-700',
}

const STAGE_COLOR: Record<string, string> = {
  dossier:   'bg-blue-900/40  text-blue-300',
  guion:     'bg-yellow-900/40 text-yellow-300',
  narration: 'bg-orange-900/40 text-orange-300',
  assembly:  'bg-pink-900/40  text-pink-300',
  published: 'bg-green-900/40 text-green-300',
}

function modelLabel(model: string) {
  return model.split('-').slice(1, 3).join('-')
}

async function AgentsGrid() {
  const files = await listAgents()
  const agents = await Promise.all(
    files.map(async ({ name }) => {
      const { content } = await getAgent(name)
      return { name, ...parseAgent(content) }
    })
  )

  return (
    <section>
      <h2 className="text-xs uppercase tracking-widest text-slate-500 mb-4">Agentes</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map(agent => (
          <Link
            key={agent.name}
            href={`/agents/${agent.name}`}
            className="group flex flex-col p-5 rounded-2xl border border-slate-800 bg-slate-900 hover:border-slate-600 hover:bg-slate-800/80 transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <span className="font-semibold text-white group-hover:text-violet-300 transition-colors">
                {agent.name}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-mono ${MODEL_BADGE[agent.model] ?? 'bg-slate-700 text-slate-300 border-slate-600'}`}>
                {modelLabel(agent.model)}
              </span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-4 flex-1 line-clamp-2">
              {agent.description}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {agent.tools.split(',').map(t => t.trim()).filter(Boolean).map(tool => (
                <span key={tool} className="text-xs bg-slate-800 text-slate-500 px-2 py-0.5 rounded-md border border-slate-700">
                  {tool}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

async function EpisodesTable() {
  let episodes: Array<{ name: string }> = []
  try { episodes = await listEpisodes() } catch {}

  if (episodes.length === 0) {
    return (
      <section>
        <h2 className="text-xs uppercase tracking-widest text-slate-500 mb-4">Episodios</h2>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center text-slate-500 text-sm">
          No hay episodios todavía.{' '}
          <code className="text-violet-400 font-mono">/producir-episodio EP001</code>{' '}
          para empezar.
        </div>
      </section>
    )
  }

  const rows = await Promise.all(
    episodes.map(async ({ name }) => {
      const meta = await getEpisodeMeta(name)
      const stage = meta?.match(/^stage:\s*(.+)$/m)?.[1]?.trim() ?? '—'
      const approved = meta?.includes('approved_by: JD') ?? false
      return { name, stage, approved }
    })
  )

  return (
    <section>
      <h2 className="text-xs uppercase tracking-widest text-slate-500 mb-4">Episodios</h2>
      <div className="rounded-2xl border border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-slate-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-5 py-3">Episodio</th>
              <th className="text-left px-5 py-3">Stage</th>
              <th className="text-left px-5 py-3">Compliance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {rows.map(row => (
              <tr key={row.name} className="bg-slate-900/50 hover:bg-slate-800/50 transition-colors">
                <td className="px-5 py-3 font-mono text-slate-300">{row.name}</td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 rounded-md text-xs ${STAGE_COLOR[row.stage] ?? 'bg-slate-800 text-slate-400'}`}>
                    {row.stage}
                  </span>
                </td>
                <td className="px-5 py-3">
                  {row.approved
                    ? <span className="text-green-400 text-xs">✓ Aprobado por JD</span>
                    : <span className="text-slate-600 text-xs">Pendiente</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default function Dashboard() {
  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Panel de control</h1>
        <p className="text-slate-400 text-sm">Gestiona agentes y supervisa el pipeline.</p>
      </div>
      <AgentsGrid />
      <EpisodesTable />
    </div>
  )
}
