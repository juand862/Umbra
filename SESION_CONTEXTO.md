# UMBRA — Handoff de sesión (2026-06-27)

## Estado del repositorio

- Rama principal: `main`
- Rama de trabajo activa: `claude/rebecca-coriam-dossier-lctevg` (ya mergeada a main, reutilizar para próximos cambios)
- Dashboard desplegado en Vercel (producción = main)

## EP001 — Rebecca Coriam: Overboard on the Disney Wonder

### Artefactos en `episodes/EP001_rebecca-coriam/`
| Archivo | Estado |
|---|---|
| `00_dossier.md` | ✓ Completo |
| `01_guion.md` | ✓ Completo (aprobado H1) |
| `02_shotlist.md` | ✓ Completo |
| `05_empaque.md` | ✓ Completo |
| `compliance.md` | ✗ Pendiente — ejecutar desde el dashboard |

### meta.yaml actual
```yaml
ep_id: EP001
slug: EP001_rebecca-coriam
title: "Rebecca Coriam: Overboard on the Disney Wonder"
stage: empaque
updated: 2026-06-27
h1_approved: true
```

### Próximo paso
Dashboard → EP001 → **"Ejecutar compliance"** (stage: empaque).
- Genera `compliance.md` → avanza a `stage: a0`
- En `a0`, JD lee el reporte → **"Aprobar para publicar"** → `stage: publicado` + `approved_by: JD`

## Pipeline completo

```
curador → dossier → guion → [H1 JD] → narracion → visuales → ensamble → empaque → [compliance] → a0 → [JD aprueba] → publicado
```

### Stages con agente ejecutable desde el front
| Stage | Agente | Modelo | Output |
|---|---|---|---|
| curador | curador | sonnet-4-6 | 00_dossier.md |
| dossier | guionista | opus-4-8 | 01_guion.md |
| guion | guionista | opus-4-8 | 01_guion.md (re-run) |
| narracion | director-visual | sonnet-4-6 | 02_shotlist.md |
| ensamble | empaquetador | sonnet-4-6 | 05_empaque.md |
| empaque | compliance | sonnet-4-6 | compliance.md |

### Gates manuales (JD)
- **H1** en stage `guion`: "Aprobar guion" → avanza a `h1` con `h1_approved: true`
- **A0** en stage `a0`: "Aprobar para publicar" → avanza a `publicado` con `approved_by: JD`

## Arquitectura del dashboard

- **Framework**: Next.js 14 App Router — directorio `dashboard/`
- **Deploy**: Vercel, root directory = `dashboard`
- **GitHub API**: Todas las lecturas/escrituras de artefactos van contra la API de GitHub (no filesystem local)
- **Variables de entorno requeridas en Vercel**:
  - `GITHUB_TOKEN` — leer/escribir archivos del repo
  - `ANTHROPIC_API_KEY` — ejecutar agentes Claude
  - `GITHUB_OWNER` (default: `juand862`)
  - `GITHUB_REPO` (default: `Umbra`)
  - `GITHUB_BRANCH` (default: `main`)

## Archivos clave del dashboard

| Archivo | Rol |
|---|---|
| `src/components/PipelineView.tsx` | Stepper, panel de artefacto, botones de acción por stage |
| `src/app/api/episodes/[slug]/run-agent/route.ts` | SSE streaming — ejecuta agente Claude y guarda output en GitHub |
| `src/app/api/episodes/[slug]/file/route.ts` | GET — lee cualquier .md del episodio desde GitHub |
| `src/app/api/episodes/[slug]/meta/route.ts` | PUT — actualiza meta.yaml |
| `src/app/api/episodes/new/route.ts` | POST — crea nuevo episodio |
| `src/lib/github.ts` | Helpers GitHub API |
| `src/components/NewEpisodeButton.tsx` | Modal para crear nuevo episodio |

## Fixes importantes (PRs mergeados hoy)

- **PR #9**: Detalle de error en ejecución de agentes (mensaje exacto en vez de genérico)
- **PR #10**: Paso de compliance antes de publicar + Gate A0 en stage correcto
- **PR #11**: Fix crítico de guardado — bypass del cache Next.js (`cache: 'no-store'`) al obtener SHA antes de PUT. Antes el archivo no se guardaba si el cache devolvía datos stale.

## Convención de trabajo

- **NUNCA** modificar el pipeline vía CLI/repo — todo por el dashboard
- Rama de feature: `claude/rebecca-coriam-dossier-lctevg` → rebasar sobre main antes de cada PR
- Flujo: draft PR → preview Vercel → merge squash

## Para iniciar EP002+

Dashboard → **"Nuevo episodio"** → auto-sugiere número → crea `meta.yaml` en `stage: curador` → ejecutar curador desde el front. El curador consulta `data/casos_cubiertos.csv` antes de elegir caso (anti-duplicados).
