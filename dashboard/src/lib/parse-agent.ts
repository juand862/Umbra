export interface AgentMeta {
  name: string
  description: string
  tools: string
  model: string
  body: string
}

export function parseAgent(raw: string): AgentMeta {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!match) return { name: '', description: '', tools: '', model: '', body: raw }

  const fm = match[1]
  const body = match[2].trim()

  const get = (key: string) => {
    const m = fm.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))
    return m ? m[1].trim() : ''
  }

  return { name: get('name'), description: get('description'), tools: get('tools'), model: get('model'), body }
}
