'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

function nextEpId(existing: string[]): string {
  const nums = existing
    .map(n => parseInt(n.match(/^EP(\d+)/)?.[1] ?? '0', 10))
    .filter(n => n > 0)
  const max = nums.length ? Math.max(...nums) : 0
  return `EP${String(max + 1).padStart(3, '0')}`
}

export default function NewEpisodeButton({ existingSlugs }: { existingSlugs: string[] }) {
  const router = useRouter()
  const [open, setOpen]   = useState(false)
  const [epId, setEpId]   = useState(() => nextEpId(existingSlugs))
  const [hint, setHint]   = useState('')
  const [busy, setBusy]   = useState(false)
  const [err, setErr]     = useState<string | null>(null)
  const [done, setDone]   = useState<string | null>(null)

  function openModal() {
    setEpId(nextEpId(existingSlugs))
    setHint('')
    setErr(null)
    setDone(null)
    setOpen(true)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setErr(null)
    try {
      const res = await fetch('/api/episodes/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ep_id: epId, hint: hint.trim() || undefined }),
      })
      const data = await res.json() as { slug?: string; error?: string }
      if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`)
      setDone(data.slug ?? epId)
      router.refresh()
    } catch (e) {
      setErr(String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        onClick={openModal}
        className="text-xs px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium transition-colors"
      >
        + Nuevo episodio
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-white">Nuevo episodio</h2>
              <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-white transition-colors text-lg leading-none">×</button>
            </div>

            {done ? (
              <div className="space-y-4">
                <div className="rounded-xl bg-green-900/30 border border-green-800 p-4">
                  <p className="text-green-400 font-medium text-sm">Scaffold creado: <code className="font-mono">{done}</code></p>
                  <p className="text-slate-400 text-xs mt-1">El episodio aparece en la tabla con <code className="text-violet-400">stage: curador</code>.</p>
                </div>
                <div className="rounded-xl bg-slate-800 border border-slate-700 p-4">
                  <p className="text-slate-400 text-xs mb-2">Ejecuta el agente curador para generar el dossier:</p>
                  <code className="text-violet-300 text-xs font-mono block">claude --agent curador</code>
                </div>
                <button onClick={() => setOpen(false)} className="w-full py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition-colors">
                  Cerrar
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">ID del episodio</label>
                  <input
                    type="text"
                    value={epId}
                    onChange={e => setEpId(e.target.value.toUpperCase())}
                    pattern="EP\d{3}"
                    required
                    placeholder="EP002"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-violet-500"
                  />
                  <p className="text-slate-600 text-xs mt-1">Formato: EP001, EP002…</p>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Hint de tema <span className="text-slate-600">(opcional)</span></label>
                  <input
                    type="text"
                    value={hint}
                    onChange={e => setHint(e.target.value)}
                    placeholder="ej. desaparición en crucero, caso frío UK"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500 placeholder:text-slate-600"
                  />
                </div>

                {err && <p className="text-red-400 text-xs">{err}</p>}

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={busy}
                    className="flex-1 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium disabled:opacity-40 transition-colors"
                  >
                    {busy ? 'Creando…' : 'Crear episodio →'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
