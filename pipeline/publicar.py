"""
Input:  episodes/<ep>/04_video.mp4
        episodes/<ep>/05_empaque.md  (título, descripción, tags, capítulos)
        episodes/<ep>/meta.yaml      (debe contener approved_by: JD)
Output: video subido a YouTube con metadata completa y AI disclosure

Usage: python pipeline/publicar.py <episode_folder>
       e.g.  python pipeline/publicar.py episodes/EP001_caso-slug

SAFETY GATE: aborta si meta.yaml no contiene `approved_by: JD`.
Requires: YOUTUBE_API_KEY y YOUTUBE_CHANNEL_ID en .env
"""

import os
import sys
from pathlib import Path

import yaml  # pip install pyyaml


def publicar(episode_folder: str) -> None:
    ep = Path(episode_folder)
    meta_path = ep / "meta.yaml"

    # SAFETY GATE — no se salta bajo ninguna circunstancia
    if not meta_path.exists():
        raise FileNotFoundError(f"meta.yaml no encontrado en {ep}")
    meta = yaml.safe_load(meta_path.read_text(encoding="utf-8"))
    if meta.get("approved_by") != "JD":
        raise PermissionError(
            "PUBLICACIÓN BLOQUEADA: meta.yaml no contiene `approved_by: JD`. "
            "JD debe aprobar el episodio antes de publicar."
        )

    video_path = ep / "04_video.mp4"
    empaque_path = ep / "05_empaque.md"

    if not video_path.exists():
        raise FileNotFoundError(f"Video no encontrado: {video_path}")
    if not empaque_path.exists():
        raise FileNotFoundError(f"Empaque no encontrado: {empaque_path}")

    api_key = os.environ.get("YOUTUBE_API_KEY")
    if not api_key:
        raise EnvironmentError("YOUTUBE_API_KEY no está definida en .env")

    # TODO: parsear 05_empaque.md, construir metadata, llamar YouTube Data API v3
    raise NotImplementedError("Integración con YouTube Data API pendiente de implementar")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Uso: python pipeline/publicar.py <episode_folder>")
        sys.exit(1)
    publicar(sys.argv[1])
