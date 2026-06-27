'use client'

import { useState } from 'react'

const PIPELINE = [
  { id: 'dossier',   label: 'Dossier',   agent: 'A1', isGate: false },
  { id: 'guion',     label: 'Guion',     agent: 'A2', isGate: false },
  { id: 'h1',        label: 'Gate H1',   agent: 'JD', isGate: true  },
  { id: 'narracion', label: 'Narración', agent: 'A3', isGate: false },
  { id: 'visuales',  label: 'Visuales',  agent: 'A4', isGate: false },
  { id: 'ensamble',  label: 'Ensamble',  agent: 'A5', isGate: false },
  { id: 'empaque',   label: 'Empaque',   agent: 'A6', isGate: false },
  { id: 'a0',        label: 'Gate A0',   agent: 'JD', isGate: true  },
  { id: 'publicado', label: 'Publicado', agent: 'A7', isGate: false },
]

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

interface Props {
  slug: string
  currentStage: string
  h1Approved: boolean
  approvedByJD: boolean
  metaContent: string
  metaSha: string
}

export default function PipelineView({ slug, currentStage, h1Approved, approvedByJD, metaContent, metaSha }: Props) {
  const [saving, setSaving] = useState(false)
  const [msg, setMsg]       = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const stageIdx = PIPELINE.findIndex(s => s.id === currentStage)

  async function saveUpdates(updates: Record<string, string>) {
    setSaving(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/episodes/${slug}/meta`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: upsertYaml(metaContent, updates), sha: metaSha }),
      })
      if (!res.ok) throw new Error()
      setMsg({ type: 'ok', text: 'Guardado — recarga para ver el nuevo estado' })
    } catch {
      setMsg({ type: 'err', text: 'Error al guardar. ¿Está configurado GITHUB_TOKEN?' })
    } finally {
      setSaving(false)
    }
  }

  const today = new Date().toISOString().slice(0, 10)
  const nextStage = PIPELINE[stageIdx + 1]?.id

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 overflow-x-auto">
        <h2 className="text-xs uppercase tracking-widest text-slate-500 mb-6">Pipeline</h2>
        <div className="flex items-start">
          {PIPELINE.map((step, i) => {
            const done    = stageIdx > i
            const current = stageIdx === i
            return (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center gap-2" style={{ minWidth: 72 }}>
                  <div className={[
                    'w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all',
                    done    ? 'bg-green-500/20 border-green-500 text-green-400' : '',
                    current && !step.isGate ? 'bg-violet-500/20 border-violet-500 text-violet-300 ring-4 ring-violet-500/20' : '',
                    current &&  step.isGate ? 'bg-amber-500/20  border-amber-400  text-amber-300  ring-4 ring-amber-500/20'  : '',
                    !done && !current       ? 'bg-slate-800 border-slate-700 text-slate-600'                                  : '',
                  ].filter(Boolean).join(' ')}>
                    {done ? '✓' : step.isGate ? '⚑' : step.agent}
                  </div>
                  <span className={`text-xs text-center leading-tight whitespace-nowrap ${
                    done ? 'text-green-400' : current ? 'text-white font-medium' : 'text-slate-600'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {i < PIPELINE.length - 1 && (
                  <div className={`h-px w-6 mb-5 flex-shrink-0 ${done ? 'bg-green-500/50' : 'bg-slate-700'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Action cards */}
      {currentStage === 'guion' && !h1Approved && (
        <GateCard
          gate="H1" color="amber"
          label="Aprobar guion"
          description="Confirma que el guion tiene el ángulo, POV y tono correctos. Avanza el pipeline a narración."
          saving={saving}
          onApprove={() => saveUpdates({ stage: 'h1', h1_approved: 'true', updated: today })}
        />
      )}

      {currentStage === 'empaque' && !approvedByJD && (
        <GateCard
          gate="A0" color="green"
          label="Aprobar para publicar"
          description="Confirma que el episodio pasó compliance y está listo para YouTube."
          saving={saving}
          onApprove={() => saveUpdates({ stage: 'a0', approved_by: 'JD', updated: today })}
        />
      )}

      {!['guion', 'empaque', 'publicado', ''].includes(currentStage) && nextStage && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-white">Marcar etapa completada</p>
            <p className="text-slate-400 text-sm mt-0.5">
              <code className="text-violet-400">{currentStage}</code>
              {' → '}
              <code className="text-violet-400">{nextStage}</code>
            </p>
          </div>
          <button
            onClick={() => saveUpdates({ stage: nextStage, updated: today })}
            disabled={saving}
            className="shrink-0 px-5 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium text-sm disabled:opacity-40 transition-colors"
          >
            {saving ? 'Guardando…' : 'Avanzar →'}
          </button>
        </div>
      )}

      {currentStage === 'publicado' && (
        <div className="rounded-2xl border border-green-800 bg-green-900/20 p-5 text-center">
          <p className="text-green-400 font-semibold">✓ Episodio publicado</p>
        </div>
      )}

      {msg && (
        <p className={`text-sm ${msg.type === 'ok' ? 'text-green-400' : 'text-red-400'}`}>{msg.text}</p>
      )}
    </div>
  )
}

function GateCard({ gate, label, description, color, saving, onApprove }: {
  gate: string; label: string; description: string
  color: 'amber' | 'green'; saving: boolean; onApprove: () => void
}) {
  const c = {
    amber: { border: 'border-amber-800', bg: 'bg-amber-900/20', badge: 'bg-amber-900/60 text-amber-300', btn: 'bg-amber-600 hover:bg-amber-500' },
    green: { border: 'border-green-800', bg: 'bg-green-900/20', badge: 'bg-green-900/60 text-green-300', btn: 'bg-green-600 hover:bg-green-500' },
  }[color]
  return (
    <div className={`rounded-2xl border ${c.border} ${c.bg} p-5 flex items-center justify-between gap-4`}>
      <div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-mono mb-1.5 inline-block ${c.badge}`}>Compuerta {gate}</span>
        <p className="font-semibold text-white">{label}</p>
        <p className="text-slate-400 text-sm mt-0.5">{description}</p>
      </div>
      <button
        onClick={onApprove} disabled={saving}
        className={`shrink-0 px-5 py-2 rounded-lg text-white font-medium text-sm ${c.btn} disabled:opacity-40 transition-colors`}
      >
        {saving ? 'Guardando…' : 'Aprobar'}
      </button>
    </div>
  )
}
