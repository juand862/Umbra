'use client'

import { useState } from 'react'

interface Props {
  name: string
  initialContent: string
  sha: string
}

export default function AgentEditor({ name, initialContent, sha }: Props) {
  const [content, setContent]   = useState(initialContent)
  const [saving, setSaving]     = useState(false)
  const [msg, setMsg]           = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const dirty = content !== initialContent

  async function save() {
    setSaving(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/agents/${name}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, sha }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`)
      }
      setMsg({ type: 'ok', text: 'Guardado en GitHub ✓' })
    } catch (e) {
      setMsg({ type: 'err', text: String(e) })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs uppercase tracking-widest text-slate-500">Prompt completo (.md)</span>
        <div className="flex items-center gap-3">
          {msg && (
            <span className={`text-sm ${msg.type === 'ok' ? 'text-green-400' : 'text-red-400'}`}>
              {msg.text}
            </span>
          )}
          <button
            onClick={save}
            disabled={saving || !dirty}
            className="px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>

      <textarea
        value={content}
        onChange={e => { setContent(e.target.value); setMsg(null) }}
        spellCheck={false}
        className="w-full h-[28rem] font-mono text-sm leading-relaxed bg-slate-900 border border-slate-700 rounded-2xl p-5 text-slate-200 focus:outline-none focus:border-violet-500 resize-y transition-colors"
      />

      {dirty && (
        <p className="mt-2 text-xs text-slate-500">
          Cambios sin guardar — Guardar hace commit directo a la rama configurada.
        </p>
      )}
    </div>
  )
}
