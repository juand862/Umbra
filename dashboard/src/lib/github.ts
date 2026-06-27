const TOKEN  = process.env.GITHUB_TOKEN
const OWNER  = process.env.GITHUB_OWNER  ?? 'juand862'
const REPO   = process.env.GITHUB_REPO   ?? 'Umbra'
const BRANCH = process.env.GITHUB_BRANCH ?? 'main'
const API    = 'https://api.github.com'

function readHeaders() {
  const h: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (TOKEN) h['Authorization'] = `Bearer ${TOKEN}`
  return h
}

function writeHeaders() {
  if (!TOKEN) throw new Error('GITHUB_TOKEN no configurado — necesario para guardar cambios')
  return {
    Authorization: `Bearer ${TOKEN}`,
    Accept: 'application/vnd.github.v3+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  }
}

export async function listAgents(): Promise<Array<{ name: string }>> {
  const res = await fetch(
    `${API}/repos/${OWNER}/${REPO}/contents/.claude/agents?ref=${BRANCH}`,
    { headers: readHeaders(), next: { revalidate: 30 } }
  )
  if (!res.ok) throw new Error(`GitHub ${res.status}`)
  const files = (await res.json()) as Array<{ name: string; type: string }>
  return files.filter(f => f.name.endsWith('.md')).map(f => ({ name: f.name.replace('.md', '') }))
}

export async function getAgent(name: string) {
  const path = `.claude/agents/${name}.md`
  const res = await fetch(
    `${API}/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`,
    { headers: readHeaders(), cache: 'no-store' }
  )
  if (!res.ok) throw new Error(`GitHub ${res.status}`)
  const data = (await res.json()) as { content: string; sha: string }
  return {
    content: Buffer.from(data.content, 'base64').toString('utf-8'),
    sha: data.sha,
    path,
  }
}

export async function updateAgent(name: string, content: string, sha: string) {
  const path = `.claude/agents/${name}.md`
  const res = await fetch(`${API}/repos/${OWNER}/${REPO}/contents/${path}`, {
    method: 'PUT',
    headers: writeHeaders(),
    body: JSON.stringify({
      message: `update(agent): ${name}`,
      content: Buffer.from(content).toString('base64'),
      sha,
      branch: BRANCH,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message ?? `GitHub ${res.status}`)
  }
  return res.json()
}

export async function listEpisodes(): Promise<Array<{ name: string }>> {
  const res = await fetch(
    `${API}/repos/${OWNER}/${REPO}/contents/episodes?ref=${BRANCH}`,
    { headers: readHeaders(), next: { revalidate: 30 } }
  )
  if (res.status === 404) return []
  if (!res.ok) throw new Error(`GitHub ${res.status}`)
  const dirs = (await res.json()) as Array<{ name: string; type: string }>
  return dirs.filter(d => d.type === 'dir')
}

export async function getEpisodeMeta(slug: string): Promise<string | null> {
  const res = await fetch(
    `${API}/repos/${OWNER}/${REPO}/contents/episodes/${slug}/meta.yaml?ref=${BRANCH}`,
    { headers: readHeaders(), next: { revalidate: 30 } }
  )
  if (!res.ok) return null
  const data = (await res.json()) as { content: string }
  return Buffer.from(data.content, 'base64').toString('utf-8')
}

export async function getEpisodeMetaWithSha(slug: string): Promise<{ content: string; sha: string } | null> {
  const res = await fetch(
    `${API}/repos/${OWNER}/${REPO}/contents/episodes/${slug}/meta.yaml?ref=${BRANCH}`,
    { headers: readHeaders(), cache: 'no-store' }
  )
  if (!res.ok) return null
  const data = (await res.json()) as { content: string; sha: string }
  return {
    content: Buffer.from(data.content, 'base64').toString('utf-8'),
    sha: data.sha,
  }
}

export async function createFile(path: string, content: string) {
  const res = await fetch(`${API}/repos/${OWNER}/${REPO}/contents/${path}`, {
    method: 'PUT',
    headers: writeHeaders(),
    body: JSON.stringify({
      message: `chore: scaffold ${path}`,
      content: Buffer.from(content).toString('base64'),
      branch: BRANCH,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message ?? `GitHub ${res.status}`)
  }
  return res.json()
}

export async function updateEpisodeMeta(slug: string, content: string, sha: string) {
  const path = `episodes/${slug}/meta.yaml`
  const res = await fetch(`${API}/repos/${OWNER}/${REPO}/contents/${path}`, {
    method: 'PUT',
    headers: writeHeaders(),
    body: JSON.stringify({
      message: `update(meta): ${slug}`,
      content: Buffer.from(content).toString('base64'),
      sha,
      branch: BRANCH,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message ?? `GitHub ${res.status}`)
  }
  return res.json()
}
