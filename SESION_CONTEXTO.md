# UMBRA — Contexto de sesión (ancla para nueva ventana)

## Estado del proyecto (2026-06-27)

### Repo
- `juand862/Umbra` — rama principal: `main`
- Rama de desarrollo: `claude/project-setup-4ondgo` (sincronizada con main)

### Dashboard desplegado
- URL: `umbra-henna-chi.vercel.app`
- Framework: Next.js 14 App Router, desplegado en Vercel desde raíz del repo
- Root `package.json` delega build a `dashboard/`
- `vercel.json` → `outputDirectory: ".next"`

### Estructura del repo
```
.claude/agents/          # 6 agentes: curador, guionista, compliance, analista, director-visual, empaquetador
.claude/commands/        # producir-episodio.md
pipeline/                # publicar.py (safety gate: requiere approved_by: JD)
data/casos_cubiertos.csv
data/metricas.csv
episodes/                # vacío aún — EP001 en proceso
dashboard/               # Next.js app
  src/app/page.tsx                        # Dashboard principal
  src/app/agents/[name]/page.tsx          # Editor de agente
  src/app/episodes/[slug]/page.tsx        # Pipeline visual del episodio
  src/app/api/agents/[name]/route.ts
  src/app/api/episodes/[slug]/meta/route.ts
  src/lib/github.ts                       # GitHub Contents API (reads sin token, writes requieren GITHUB_TOKEN)
  src/components/AgentEditor.tsx
  src/components/PipelineView.tsx         # Stepper 9 etapas + botones H1/A0
```

### Pipeline de producción (orden fijo)
```
A1 curador → A2 guionista → [H1 JD revisa guion] → A3 narrar + A4 visuales →
A5 ensamblar → A6 empaque → [A0 compliance + JD aprueba] → A7 publicar → A8 medir
```

### Compuertas humanas (NUNCA delegar)
- **H1**: tras `01_guion.md` — JD impone ángulo, POV y variación
- **A0**: antes de publicar — JD lee `compliance.md` y aprueba con `approved_by: JD`

### Convenciones de meta.yaml
```yaml
ep_id: EP001
slug: EP001_<slug>
title: "<título>"
stage: dossier | guion | h1 | narracion | visuales | ensamble | empaque | a0 | publicado
h1_approved: true          # solo tras H1
approved_by: JD            # solo tras A0
updated: YYYY-MM-DD
```

---

## Estado actual: EP001 en curso

**Paso activo**: Agente `curador` (A1) corriendo en background — buscando caso de desaparición.

**Qué sigue cuando termines esta ventana:**
1. Verificar si el curador terminó: revisar si existe `episodes/EP001_*/00_dossier.md` en el repo
2. Si terminó → leer el dossier y mostrárselo al usuario para aprobación
3. Si no terminó → relanzar el curador con el prompt del archivo `SESION_CONTEXTO.md`

### Prompt para relanzar el curador (si no terminó)
Delegar al agente `curador` con esta instrucción:
> Eres el agente curador (A1) del canal UMBRA. Sub-ángulo: desapariciones inexplicadas.
> Elige un caso real sin resolver, investiga fuentes, crea `episodes/EP001_<slug>/00_dossier.md`
> y `episodes/EP001_<slug>/meta.yaml` (stage: dossier). Actualiza `data/casos_cubiertos.csv`.
> Estructura del dossier: Caso, Ángulo único, Cronología, Fuentes verificadas,
> Clasificación de hechos ([CONFIRMADO]/[ALEGADO]/[DISPUTADO]), Evaluación de riesgo.
> Fecha hoy: 2026-06-27.

---

## Variables de entorno necesarias en Vercel
- `GITHUB_TOKEN` — solo para writes desde el dashboard (editar agentes, avanzar pipeline)
- Sin token: dashboard funciona en modo lectura

## Modelos usados
- `claude-sonnet-4-6` — agentes: curador, compliance, analista, director-visual, empaquetador
- `claude-opus-4-8` — agente: guionista
