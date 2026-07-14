# UMBRA — canal faceless de casos reales sin resolver

## Misión
Producir videos en inglés de unsolved cases con autoría humana clara.
Línea de exploración/aprendizaje. NO toca proyecciones financieras hasta el scale-gate.

## Restricción no negociable (política 2026)
YouTube desmoneta a nivel de CANAL los formatos "replicables en una tarde".
Cada episodio debe pasar el test de A0: *¿alguien al azar copiaría esto con los
mismos prompts y assets?* Si sí → no se publica. La autoría humana (H1, A0) es obligatoria.

## Pipeline (orden fijo)
A1 curador → A2 guionista → [H1 JD revisa guion] → A3 narrar (ElevenLabs TTS) →
A4 visuales (ElevenLabs Video / Kling 2.5 Turbo, escena por escena con prompts de `02_shotlist.md`) →
A5 ensamblar (CapCut / DaVinci Resolve: clips Kling + audio narración) →
A6 empaque → [A0 compliance + JD aprueba] → A7 publicar → A8 medir → feedback

## Herramientas de producción manual
- **Narración**: ElevenLabs Text to Speech
- **Video por escena**: ElevenLabs Video (Kling 2.5 Turbo) — prompts del `02_shotlist.md`
- **Ensamblaje**: CapCut o DaVinci Resolve
- **Subtítulos/transcript**: YouTube Studio auto-captions (subir No Listado primero)

## Compuertas humanas (no delegar nunca)
- H1: tras `01_guion.md`. JD impone ángulo, POV y variación. Sin esto, vuelve a A2.
- A0: antes de publicar. JD lee `compliance.md` y aprueba explícitamente.

## Convenciones
- Un episodio = un folder `episodes/EP###_<slug>/`. Numerar artefactos 00–05.
- A1 SIEMPRE consulta y actualiza `data/casos_cubiertos.csv` (anti-duplicados).
- Cada cambio de etapa actualiza `meta.yaml` (campo `stage` y `updated`).
- Nada se publica sin `compliance.md` con `approved_by: JD`.

## Gates de negocio
- Kill-gate M9: sin YPP full + retención sin mejora → cerrar.
- Scale-gate M9–M12: $/video > costo/video → reinvertir; si no → cerrar.
