export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { listAgents, getAgent, listEpisodes, getEpisodeMeta } from '@/lib/github'
import { parseAgent } from '@/lib/parse-agent'
import NewEpisodeButton from '@/components/NewEpisodeButton'

const MODEL_BADGE: Record<string, string> = {
  'claude-sonnet-4-6': 'bg-violet-900/60 text-violet-300 border-violet-700',
  'claude-opus-4-8':   'bg-amber-900/60  text-amber-300  border-amber-700',
}

const STAGE_COLOR: Record<string, string> = {
  curador:   'bg-slate-700/60  text-slate-300',
  dossier:   'bg-blue-900/40   text-blue-300',
  guion:     'bg-yellow-900/40 text-yellow-300',
  h1:        'bg-amber-900/40  text-amber-300',
  narracion: 'bg-orange-900/40 text-orange-300',
  visuales:  'bg-pink-900/40   text-pink-300',
  ensamble:  'bg-purple-900/40 text-purple-300',
  empaque:   'bg-cyan-900/40   text-cyan-300',
  a0:        'bg-amber-900/40  text-amber-300',
  publicado: 'bg-green-900/40  text-green-300',
}

function modelLabel(m: string) { return m.split('-').slice(1, 3).join('-') }

const AGENT_ORDER: Record<string, { step: string; color: string }> = {
  'curador':        { step: 'A1', color: 'bg-violet-900/60 text-violet-300 border-violet-800' },
  'guionista':      { step: 'A2', color: 'bg-violet-900/60 text-violet-300 border-violet-800' },
  'director-visual':{ step: 'A4', color: 'bg-violet-900/60 text-violet-300 border-violet-800' },
  'empaquetador':   { step: 'A6', color: 'bg-violet-900/60 text-violet-300 border-violet-800' },
  'compliance':     { step: 'A0', color: 'bg-amber-900/60  text-amber-300  border-amber-800'  },
  'analista':       { step: 'A8', color: 'bg-slate-700/60  text-slate-300  border-slate-600'  },
}
const AGENT_SORT = ['curador','guionista','director-visual','empaquetador','compliance','analista']

async function AgentsGrid() {
  const files = await listAgents()
  const agents = await Promise.all(
    files.map(async ({ name }) => {
      const { content } = await getAgent(name)
      const { name: _n, ...meta } = parseAgent(content)
      return { name, ...meta }
    })
  )
  const sorted = [...agents].sort((a, b) => {
    const ai = AGENT_SORT.indexOf(a.name)
    const bi = AGENT_SORT.indexOf(b.name)
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })
  return (
    <section>
      <h2 className="text-xs uppercase tracking-widest text-slate-500 mb-4">Agentes</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.map(agent => {
          const meta = AGENT_ORDER[agent.name]
          return (
            <Link key={agent.name} href={`/agents/${agent.name}`}
              className="group flex flex-col p-5 rounded-2xl border border-slate-800 bg-slate-900 hover:border-slate-600 hover:bg-slate-800/80 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {meta && (
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-mono shrink-0 ${meta.color}`}>
                      {meta.step}
                    </span>
                  )}
                  <span className="font-semibold text-white group-hover:text-violet-300 transition-colors">{agent.name}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-mono shrink-0 ${MODEL_BADGE[agent.model] ?? 'bg-slate-700 text-slate-300 border-slate-600'}`}>
                  {modelLabel(agent.model)}
                </span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-4 flex-1 line-clamp-2">{agent.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {agent.tools.split(',').map(t => t.trim()).filter(Boolean).map(tool => (
                  <span key={tool} className="text-xs bg-slate-800 text-slate-500 px-2 py-0.5 rounded-md border border-slate-700">{tool}</span>
                ))}
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

async function EpisodesTable() {
  let episodes: Array<{ name: string }> = []
  try { episodes = await listEpisodes() } catch {}

  const slugs = episodes.map(e => e.name)

  if (episodes.length === 0) {
    return (
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs uppercase tracking-widest text-slate-500">Producción</h2>
          <NewEpisodeButton existingSlugs={slugs} />
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center text-slate-500 text-sm">
          No hay episodios todavía. Usa el botón para iniciar el primer pipeline.
        </div>
      </section>
    )
  }

  const rows = await Promise.all(
    episodes.map(async ({ name }) => {
      const meta = await getEpisodeMeta(name)
      const stage    = meta?.match(/^stage:\s*(.+)$/m)?.[1]?.trim() ?? '—'
      const approved = meta?.includes('approved_by: JD') ?? false
      return { name, stage, approved }
    })
  )

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs uppercase tracking-widest text-slate-500">Producción</h2>
        <NewEpisodeButton existingSlugs={slugs} />
      </div>
      <div className="rounded-2xl border border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-slate-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-5 py-3">Episodio</th>
              <th className="text-left px-5 py-3">Stage</th>
              <th className="text-left px-5 py-3">Compliance</th>
              <th className="text-left px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {rows.map(row => (
              <tr key={row.name} className="bg-slate-900/50 hover:bg-slate-800/50 transition-colors">
                <td className="px-5 py-3 font-mono text-slate-300">{row.name}</td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 rounded-md text-xs ${STAGE_COLOR[row.stage] ?? 'bg-slate-800 text-slate-400'}`}>{row.stage}</span>
                </td>
                <td className="px-5 py-3">
                  {row.approved
                    ? <span className="text-green-400 text-xs">✓ Aprobado por JD</span>
                    : <span className="text-slate-600 text-xs">Pendiente</span>}
                </td>
                <td className="px-5 py-3 text-right">
                  <Link href={`/episodes/${row.name}`}
                    className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
                    Ver pipeline →
                  </Link>
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
