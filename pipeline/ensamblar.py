"""
Input:  episodes/<ep>/03_narracion.mp3  (audio)
        episodes/<ep>/visuals/SCENE_NNN.png  (imágenes)
        episodes/<ep>/02_shotlist.md  (duración estimada por escena)
Output: episodes/<ep>/04_video.mp4  (video final con captions)

Usage: python pipeline/ensamblar.py <episode_folder>
       e.g.  python pipeline/ensamblar.py episodes/EP001_caso-slug

Requires: ffmpeg installed and available in PATH
"""

import sys
from pathlib import Path


def ensamblar(episode_folder: str) -> None:
    ep = Path(episode_folder)
    audio_path = ep / "03_narracion.mp3"
    visuals_dir = ep / "visuals"
    output_path = ep / "04_video.mp4"

    if not audio_path.exists():
        raise FileNotFoundError(f"Audio no encontrado: {audio_path}")
    if not visuals_dir.exists():
        raise FileNotFoundError(f"Directorio de visuales no encontrado: {visuals_dir}")

    images = sorted(visuals_dir.glob("SCENE_*.png"))
    if not images:
        raise FileNotFoundError(f"No hay imágenes en {visuals_dir}")

    # TODO: construir el comando ffmpeg con concat de imágenes + audio + captions
    raise NotImplementedError("Ensamblaje con ffmpeg pendiente de implementar")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Uso: python pipeline/ensamblar.py <episode_folder>")
        sys.exit(1)
    ensamblar(sys.argv[1])
