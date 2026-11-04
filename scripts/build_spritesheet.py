"""Construye una hoja de sprites estándar para el juego a partir de fotogramas sueltos.

El juego espera una hoja horizontal de N fotogramas del MISMO tamaño, vista lateral
(mirando a la derecha). El motor la voltea según la dirección.

Cada fotograma de entrada puede tener tamaño distinto; aquí se recorta el borde
transparente, se centra cada pose en un lienzo común y se alinean por los pies
(borde inferior) para que no "salten" al animar.

Uso:
  python scripts/build_spritesheet.py <carpeta_origen> <salida.png> <frame1> <frame2> ...
  donde cada <frameN> es el índice (natural-sort) del PNG dentro de la carpeta.

Devuelve el tamaño de fotograma por stdout (W H N) para registrarlo en el juego.
"""
import re
import sys
from pathlib import Path
from PIL import Image


def natural_key(name: str):
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r"(\d+)", name)]


def autocrop(im: Image.Image) -> Image.Image:
    bbox = im.getbbox()
    return im.crop(bbox) if bbox else im


def main():
    src = Path(sys.argv[1])
    out = Path(sys.argv[2])
    idxs = [int(x) for x in sys.argv[3:]]
    files = sorted(src.glob("*.png"), key=lambda p: natural_key(p.name))
    frames = []
    for i in idxs:
        im = autocrop(Image.open(files[i]).convert("RGBA"))
        frames.append(im)
    # lienzo común: el mayor ancho y alto de las poses elegidas, con un pequeño margen
    cw = max(f.width for f in frames) + 2
    ch = max(f.height for f in frames) + 2
    sheet = Image.new("RGBA", (cw * len(frames), ch), (0, 0, 0, 0))
    for k, f in enumerate(frames):
        ox = k * cw + (cw - f.width) // 2          # centrado horizontal
        oy = ch - f.height - 1                       # alineado por los pies
        sheet.alpha_composite(f, (ox, oy))
    out.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out)
    print(f"{cw} {ch} {len(frames)}")


if __name__ == "__main__":
    main()
