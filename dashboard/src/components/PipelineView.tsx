'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'

const RUNNABLE_STAGES: Record<string, { label: string; agentName: string }> = {
  curador:   { label: 'Ejecutar curador',        agentName: 'curador' },
  dossier:   { label: 'Ejecutar guionista',       agentName: 'guionista' },
  guion:     { label: 'Re-ejecutar guionista',    agentName: 'guionista' },
  narracion: { label: 'Ejecutar director visual', agentName: 'director-visual' },
  ensamble:  { label: 'Ejecutar empaquetador',    agentName: 'empaquetador' },
  empaque:   { label: 'Ejecutar compliance',      agentName: 'compliance' },
}

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

const STAGE_FILE: Record<string, { file: string; label: string }> = {
  dossier:   { file: '00_dossier.md',  label: 'Dossier — A1 curador' },
  guion:     { file: '01_guion.md',    label: 'Guion — A2 guionista' },
  h1:        { file: '01_guion.md',    label: 'Guion — pendiente H1' },
  narracion: { file: '01_guion.md',    label: 'Guion aprobado' },
  visuales:  { file: '02_shotlist.md', label: 'Shotlist — A4 visuales' },
  ensamble:  { file: '02_shotlist.md', label: 'Shotlist' },
  empaque:   { file: '05_empaque.md',  label: 'Empaque — A6' },
  a0:        { file: 'compliance.md',  label: 'Compliance — pendiente A0' },
  publicado: { file: '05_empaque.md',  label: 'Empaque publicado' },
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

interface Props {
  slug: string
  currentStage: string
  h1Approved: boolean
  approvedByJD: boolean
  metaContent: string
  metaSha: string
}

export default function PipelineView({ slug, currentStage, h1Approved, approvedByJD, metaContent, metaSha }: Props) {
  const router  = useRouter()
  const [saving, setSaving]          = useState(false)
  const [err, setErr]                = useState<string | null>(null)
  const [selectedStage, setSelected] = useState(currentStage)
  const [artifact, setArtifact]      = useState<string | null>(null)
  const [loading, setLoading]        = useState(false)
  const [running, setRunning]        = useState(false)
  const [streamText, setStreamText]  = useState<string | null>(null)
  const streamRef = useRef<string>('')

  const stageIdx    = PIPELINE.findIndex(s => s.id === currentStage)
  const selectedIdx = PIPELINE.findIndex(s => s.id === selectedStage)

  async function runAgent() {
    setRunning(true)
    setErr(null)
    streamRef.current = ''
    setStreamText('')
    setArtifact(null)
    try {
      const res = await fetch(`/api/episodes/${slug}/run-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: currentStage }),
      })
      if (!res.ok || !res.body) {
        let detail = `HTTP ${res.status}`
        try { const j = await res.json() as { error?: string }; if (j.error) detail = j.error } catch {}
        throw new Error(detail)
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue
          const data = JSON.parse(line.slice(6)) as { text?: string; done?: boolean; error?: string; nextStage?: string }
          if (data.error) throw new Error(data.error)
          if (data.text) {
            streamRef.current += data.text
            setStreamText(streamRef.current)
          }
          if (data.done) {
            setArtifact(streamRef.current)
            setStreamText(null)
            router.refresh()
          }
        }
      }
    } catch (e) {
      setErr(String(e))
      setStreamText(null)
    } finally {
      setRunning(false)
    }
  }

  const loadArtifact = useCallback(async (stage: string) => {
    const def = STAGE_FILE[stage]
    if (!def) { setArtifact(null); return }
    setLoading(true)
    setArtifact(null)
    try {
      const res = await fetch(`/api/episodes/${slug}/file?name=${def.file}`)
      if (!res.ok) { setArtifact(null); return }
      const data = await res.json() as { content: string }
      setArtifact(data.content)
    } catch {
      setArtifact(null)
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    loadArtifact(selectedStage)
  }, [selectedStage, loadArtifact])

  function selectStage(id: string, idx: number) {
    if (idx > stageIdx) return // futuro, no clicable
    setSelected(id)
  }

  async function saveUpdates(updates: Record<string, string>) {
    setSaving(true)
    setErr(null)
    try {
      const res = await fetch(`/api/episodes/${slug}/meta`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: upsertYaml(metaContent, updates), sha: metaSha }),
      })
      if (!res.ok) throw new Error()
      router.refresh()
    } catch {
      setErr('Error al guardar. ¿Está configurado GITHUB_TOKEN?')
    } finally {
      setSaving(false)
    }
  }

  const today     = new Date().toISOString().slice(0, 10)
  const nextStage = PIPELINE[stageIdx + 1]?.id
  const artifactDef = STAGE_FILE[selectedStage]

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 overflow-x-auto">
        <h2 className="text-xs uppercase tracking-widest text-slate-500 mb-6">Pipeline</h2>
        <div className="flex items-start">
          {PIPELINE.map((step, i) => {
            const done      = stageIdx > i
            const current   = stageIdx === i
            const future    = i > stageIdx
            const selected  = selectedStage === step.id
            const clickable = !future

            return (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex flex-col items-center gap-2 ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
                  style={{ minWidth: 72 }}
                  onClick={() => clickable && selectStage(step.id, i)}
                >
                  <div className={[
                    'w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all',
                    done && !selected  ? 'bg-green-500/20 border-green-500 text-green-400 hover:border-green-300' : '',
                    done &&  selected  ? 'bg-green-500/30 border-green-300 text-green-300 ring-4 ring-green-500/20' : '',
                    current && !step.isGate && !selected ? 'bg-violet-500/20 border-violet-500 text-violet-300 ring-4 ring-violet-500/20' : '',
                    current && !step.isGate &&  selected ? 'bg-violet-500/30 border-violet-300 text-violet-200 ring-4 ring-violet-500/30' : '',
                    current &&  step.isGate && !selected ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-4 ring-amber-500/20' : '',
                    current &&  step.isGate &&  selected ? 'bg-amber-500/30 border-amber-300 text-amber-200 ring-4 ring-amber-500/30' : '',
                    future  ? 'bg-slate-800 border-slate-700 text-slate-600' : '',
                  ].filter(Boolean).join(' ')}>
                    {done ? '✓' : step.isGate ? '⚑' : step.agent}
                  </div>
                  <span className={[
                    'text-xs text-center leading-tight whitespace-nowrap transition-colors',
                    done    ? 'text-green-400' : '',
                    current ? 'text-white font-medium' : '',
                    future  ? 'text-slate-600' : '',
                    selected && (done || current) ? 'underline underline-offset-2' : '',
                  ].filter(Boolean).join(' ')}>
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

      {/* Artifact panel */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-widest text-slate-500">
              {artifactDef?.label ?? PIPELINE[selectedIdx]?.label ?? selectedStage}
            </span>
            {selectedStage !== currentStage && (
              <span className="text-xs text-slate-600">vista histórica</span>
            )}
          </div>
          {selectedStage !== currentStage && (
            <button
              onClick={() => setSelected(currentStage)}
              className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              Ver etapa actual →
            </button>
          )}
        </div>
        <div className="p-6 min-h-32">
          {/* Streaming output */}
          {streamText !== null && (
            <div className="prose prose-invert prose-sm max-w-none
              prose-headings:text-white prose-headings:font-semibold
              prose-p:text-slate-300 prose-p:leading-relaxed
              prose-li:text-slate-300 prose-strong:text-white
              prose-code:text-violet-300 prose-code:bg-slate-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
              prose-hr:border-slate-700 prose-a:text-violet-400">
              <ReactMarkdown>{streamText}</ReactMarkdown>
              <span className="inline-block w-2 h-4 bg-violet-400 animate-pulse ml-0.5 align-middle" />
            </div>
          )}
          {streamText === null && loading && (
            <p className="text-slate-500 text-sm animate-pulse">Cargando…</p>
          )}
          {streamText === null && !loading && artifact && (
            <div className="prose prose-invert prose-sm max-w-none
              prose-headings:text-white prose-headings:font-semibold
              prose-p:text-slate-300 prose-p:leading-relaxed
              prose-li:text-slate-300 prose-strong:text-white
              prose-code:text-violet-300 prose-code:bg-slate-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
              prose-hr:border-slate-700 prose-a:text-violet-400">
              <ReactMarkdown>{artifact}</ReactMarkdown>
            </div>
          )}
          {streamText === null && !loading && !artifact && (
            <p className="text-slate-600 text-sm">
              {STAGE_FILE[selectedStage]
                ? `No hay artefacto todavía para esta etapa (${STAGE_FILE[selectedStage].file}).`
                : 'Esta etapa no tiene artefacto de texto.'}
            </p>
          )}
        </div>
      </div>

      {/* Action cards — solo para etapa actual */}
      {selectedStage === currentStage && (
        <>
          {/* Botón ejecutar agente */}
          {RUNNABLE_STAGES[currentStage] && (
            <div className="rounded-2xl border border-violet-800 bg-violet-900/20 p-5 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs px-2 py-0.5 rounded-full font-mono mb-1.5 inline-block bg-violet-900/60 text-violet-300">
                  {RUNNABLE_STAGES[currentStage].agentName}
                </span>
                <p className="font-semibold text-white">{RUNNABLE_STAGES[currentStage].label}</p>
                <p className="text-slate-400 text-sm mt-0.5">
                  Genera el artefacto con Claude y avanza el stage automáticamente.
                </p>
              </div>
              <button
                onClick={runAgent}
                disabled={running || saving}
                className="shrink-0 px-5 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium text-sm disabled:opacity-40 transition-colors"
              >
                {running ? 'Ejecutando…' : 'Ejecutar →'}
              </button>
            </div>
          )}

          {currentStage === 'guion' && !h1Approved && artifact && (
            <GateCard
              gate="H1" color="amber"
              label="Aprobar guion"
              description="Confirma que el guion tiene el ángulo, POV y tono correctos. Avanza el pipeline a narración."
              saving={saving}
              onApprove={() => saveUpdates({ stage: 'h1', h1_approved: 'true', updated: today })}
            />
          )}

          {currentStage === 'a0' && !approvedByJD && artifact && (
            <GateCard
              gate="A0" color="green"
              label="Aprobar para publicar"
              description="Confirma que el reporte de compliance es verde y el episodio está listo para YouTube."
              saving={saving}
              onApprove={() => saveUpdates({ stage: 'publicado', approved_by: 'JD', updated: today })}
            />
          )}

          {!['curador', 'dossier', 'guion', 'narracion', 'empaque', 'a0', 'publicado', ''].includes(currentStage) && nextStage && (
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

          {err && (
            <div className="rounded-xl border border-red-800 bg-red-900/20 p-4">
              <p className="text-red-400 text-xs font-mono font-semibold mb-1">Error</p>
              <p className="text-red-300 text-sm">{err}</p>
            </div>
          )}
        </>
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
