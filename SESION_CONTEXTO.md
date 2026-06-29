# UMBRA — Handoff de sesión (2026-06-29)

## Estado del repositorio

- Rama principal: `main`
- Dashboard desplegado en Vercel (producción = main)
- Últimos PRs mergeados hoy: #12 (ElevenLabs download), #13 (favicon), #14 (validacion stage)

## EP001 — Rebecca Coriam: Overboard on the Disney Wonder

### Artefactos en `episodes/EP001_rebecca-coriam/`
| Archivo | Estado |
|---|---|
| `00_dossier.md` | ✓ Completo |
| `01_guion.md` | ✓ Completo (aprobado H1) |
| `02_shotlist.md` | ✓ Completo |
| `05_empaque.md` | ✓ Completo |
| `compliance.md` | ✓ Completo (aprobado A0, `approved_by: JD`) |
| `04_validacion.md` | ✗ Pendiente — se genera cuando el video esté ensamblado |

### meta.yaml actual
```yaml
ep_id: EP001
slug: EP001_rebecca-coriam
title: "Rebecca Coriam: Overboard on the Disney Wonder"
stage: publicado
updated: 2026-06-29
h1_approved: true
approved_by: JD
```

### Estado de producción manual
EP001 ha completado el pipeline de IA. Queda producción manual:

| Paso | Herramienta | Estado |
|---|---|---|
| 1. Narración (voiceover) | ElevenLabs — Text to Speech | ⏳ En progreso |
| 2. Visuales (imágenes por escena) | Midjourney (referencia: `02_shotlist.md`) | ⏳ Pendiente |
| 3. Edición y ensamblaje | Editor de video (CapCut / Resolve) | ⏳ Pendiente |
| 4. Subir a YouTube | YouTube Studio | ⏳ Pendiente |

**Flujo para el validador (nueva feature):**
1. Sube el video ensamblado a YouTube como **No listado**
2. Copia el auto-caption generado por YouTube
3. Dashboard → EP001 → stage `ensamble` → pega transcript → **Ejecutar validador**
4. Revisa `04_validacion.md` (semáforos por categoría)
5. Si veredicto = `PUBLICABLE` → avanza a `empaque` → compliance → gate A0

## Pipeline completo (actualizado)

```
curador → dossier → guion → [H1 JD] → narracion → visuales → ensamble → [validador] → validacion → empaque → [compliance] → a0 → [JD aprueba] → publicado
```

### Stages con agente ejecutable desde el front
| Stage | Agente | Modelo | Output | Notas |
|---|---|---|---|---|
| curador | curador | sonnet-4-6 | 00_dossier.md | |
| dossier | guionista | opus-4-8 | 01_guion.md | |
| guion | guionista | opus-4-8 | 01_guion.md (re-run) | |
| narracion | director-visual | sonnet-4-6 | 02_shotlist.md | |
| ensamble | **validador** | sonnet-4-6 | **04_validacion.md** | Requiere transcript pegado en textarea |
| validacion | empaquetador | sonnet-4-6 | 05_empaque.md | |
| empaque | compliance | sonnet-4-6 | compliance.md | |

### Gates manuales (JD)
- **H1** en stage `guion`: "Aprobar guion" → avanza a `h1` con `h1_approved: true`
- **A0** en stage `a0`: "Aprobar para publicar" → avanza a `publicado` con `approved_by: JD`

## Agentes disponibles

| Archivo | Nombre | Función |
|---|---|---|
| `.claude/agents/curador.md` | curador | Selecciona y valida caso, genera dossier |
| `.claude/agents/guionista.md` | guionista | Escribe guion con POV y hooks |
| `.claude/agents/director-visual.md` | director-visual | Genera shotlist por escena |
| `.claude/agents/empaquetador.md` | empaquetador | Genera título SEO, descripción, tags, thumbnail |
| `.claude/agents/compliance.md` | compliance | Verifica política YouTube, emite semáforo |
| `.claude/agents/validador.md` | validador | Cruza transcript del video con guion y shotlist |
| `.claude/agents/analista.md` | analista | Lee métricas YouTube Studio, genera reporte |

## Features del dashboard (actualizadas)

- **Stepper visual**: 10 stages incluyendo `validacion` (badge `Val`)
- **Botón ElevenLabs**: en stage guion, descarga `01_guion.md` formateado con instrucciones y SSML breaks
- **Textarea de transcript**: en stage ensamble, requerida para activar el botón del validador
- **Tab bar en publicado**: muestra los 5 entregables del episodio (Empaque, Compliance, Guion, Shotlist, Dossier)
- **Favicon**: U blanca en fondo negro (icon.svg en app directory)

## Arquitectura del dashboard

- **Framework**: Next.js 14 App Router — directorio `dashboard/`
- **Deploy**: Vercel, root directory = `dashboard`
- **GitHub API**: Todas las lecturas/escrituras de artefactos van contra la API de GitHub
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
| `src/lib/github.ts` | Helpers GitHub API (incluye `getRepoFile` para archivos fuera del episodio) |
| `src/app/icon.svg` | Favicon (U blanca en fondo negro) |

## Convención de trabajo

- Crear siempre rama feature: `claude/<feature-slug>`
- Flujo: draft PR → preview Vercel → merge squash
- El `validador` necesita transcript en el cuerpo del request (`{ stage, transcript }`)

## Para iniciar EP002+

Dashboard → **"Nuevo episodio"** → auto-sugiere número → crea `meta.yaml` en `stage: curador` → ejecutar curador desde el front. El curador consulta `data/casos_cubiertos.csv` antes de elegir caso (anti-duplicados).
