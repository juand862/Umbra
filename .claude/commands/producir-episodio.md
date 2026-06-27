Produce el episodio $ARGUMENTS siguiendo el pipeline de CLAUDE.md:

1. Delega al agente `curador` → `00_dossier.md`. Detente y muéstrame el dossier.
2. Tras mi OK, delega al agente `guionista` → `01_guion.md`. **DETENTE (compuerta H1): espera mi revisión y edición del guion.**
3. Tras mi edición del guion, corre `pipeline/narrar.py` y delega al agente `director-visual` → `02_shotlist.md`.
4. Corre `pipeline/visuales.py` con la shotlist generada.
5. Corre `pipeline/ensamblar.py` → `04_video.mp4`.
6. Delega al agente `empaquetador` → `05_empaque.md`.
7. Delega al agente `compliance` → `compliance.md`. **DETENTE (compuerta A0): espera mi aprobación explícita.**
8. Solo con mi aprobación explícita (`approved_by: JD` en `meta.yaml`), corre `pipeline/publicar.py`.

Actualiza `meta.yaml` (campos `stage` y `updated`) al completar cada paso.
