"""
Input:  episodes/<ep>/01_guion.md  (texto plano del guion)
Output: episodes/<ep>/03_narracion.mp3  (audio generado via ElevenLabs TTS)

Usage: python pipeline/narrar.py <episode_folder>
       e.g.  python pipeline/narrar.py episodes/EP001_caso-slug
"""

import os
import sys
from pathlib import Path


def narrar(episode_folder: str) -> None:
    ep = Path(episode_folder)
    guion_path = ep / "01_guion.md"
    output_path = ep / "03_narracion.mp3"

    if not guion_path.exists():
        raise FileNotFoundError(f"Guion no encontrado: {guion_path}")

    api_key = os.environ.get("ELEVENLABS_API_KEY")
    if not api_key:
        raise EnvironmentError("ELEVENLABS_API_KEY no está definida en .env")

    text = guion_path.read_text(encoding="utf-8")
    voice_id = os.environ.get("ELEVENLABS_VOICE_ID", "")

    # TODO: llamar a ElevenLabs API con `text` y `voice_id`, guardar MP3 en output_path
    raise NotImplementedError("Integración con ElevenLabs pendiente de implementar")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Uso: python pipeline/narrar.py <episode_folder>")
        sys.exit(1)
    narrar(sys.argv[1])
