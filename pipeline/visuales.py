"""
Input:  episodes/<ep>/02_shotlist.md  (shotlist con prompts por escena)
Output: episodes/<ep>/visuals/SCENE_NNN.png  (imágenes generadas via API)

Usage: python pipeline/visuales.py <episode_folder>
       e.g.  python pipeline/visuales.py episodes/EP001_caso-slug
"""

import os
import sys
from pathlib import Path


def generar_visuales(episode_folder: str) -> None:
    ep = Path(episode_folder)
    shotlist_path = ep / "02_shotlist.md"
    output_dir = ep / "visuals"

    if not shotlist_path.exists():
        raise FileNotFoundError(f"Shotlist no encontrada: {shotlist_path}")

    api_key = os.environ.get("IMAGE_API_KEY")
    if not api_key:
        raise EnvironmentError("IMAGE_API_KEY no está definida en .env")

    output_dir.mkdir(exist_ok=True)
    shotlist = shotlist_path.read_text(encoding="utf-8")

    # TODO: parsear shotlist, extraer prompts por escena, llamar API de imagen
    raise NotImplementedError("Integración con API de imagen pendiente de implementar")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Uso: python pipeline/visuales.py <episode_folder>")
        sys.exit(1)
    generar_visuales(sys.argv[1])
