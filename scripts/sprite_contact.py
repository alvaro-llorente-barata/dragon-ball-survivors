"""Monta una hoja de contactos: todos los PNG de una carpeta en miniatura, numerados.
Sirve para ver de un vistazo los fotogramas sueltos y elegir poses.

Uso: python scripts/sprite_contact.py "<carpeta>" "<salida.png>" [cols]
"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw

def natural_key(name: str):
    import re
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r'(\d+)', name)]

def main():
    src = Path(sys.argv[1])
    out = Path(sys.argv[2])
    cols = int(sys.argv[3]) if len(sys.argv) > 3 else 12
    files = sorted([p for p in src.glob('*.png')], key=lambda p: natural_key(p.name))
    if not files:
        print('NO PNG en', src)
        return
    cell = 72          # tamaño de celda
    pad = 4
    label_h = 12
    rows = (len(files) + cols - 1) // cols
    W = cols * (cell + pad) + pad
    H = rows * (cell + pad + label_h) + pad
    sheet = Image.new('RGBA', (W, H), (30, 30, 40, 255))
    draw = ImageDraw.Draw(sheet)
    for i, f in enumerate(files):
        r, c = divmod(i, cols)
        x = pad + c * (cell + pad)
        y = pad + r * (cell + pad + label_h)
        try:
            im = Image.open(f).convert('RGBA')
        except Exception as e:
            continue
        # escalar manteniendo proporción dentro de la celda
        im.thumbnail((cell, cell), Image.NEAREST)
        ox = x + (cell - im.width) // 2
        oy = y + (cell - im.height) // 2
        # fondo a cuadros claro para ver transparencia
        draw.rectangle([x, y, x + cell, y + cell], fill=(60, 60, 75, 255))
        sheet.alpha_composite(im, (ox, oy))
        # etiqueta: índice y nombre corto
        short = f.stem.split('_')[-1]
        draw.text((x + 2, y + cell + 1), f'{i}:{short} {im.width}x{im.height}', fill=(255, 230, 120, 255))
    out.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out)
    print(f'OK {len(files)} frames -> {out}  ({W}x{H})')

if __name__ == '__main__':
    main()
