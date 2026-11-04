"""Monta un mosaico de revisión: por cada hoja generada muestra sus 4 poses
en una fila, con la clave debajo. Sirve para validar de un vistazo que idle/
andar/ataque salieron bien para todos los personajes.

Uso: python scripts/review_sheets.py <carpeta_hojas> <salida.png>
"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw


def main():
    d = Path(sys.argv[1])
    out = Path(sys.argv[2])
    sheets = sorted(p for p in d.glob("char_*.png"))
    cell = 60
    label_h = 12
    row_h = cell + label_h + 4
    cols_per_char = 4
    char_w = cols_per_char * cell + 8
    per_row = 3  # personajes por fila del mosaico
    rows = (len(sheets) + per_row - 1) // per_row
    W = per_row * char_w + 8
    H = rows * row_h + 8
    img = Image.new("RGBA", (W, H), (26, 26, 36, 255))
    draw = ImageDraw.Draw(img)
    for i, sp in enumerate(sheets):
        r, c = divmod(i, per_row)
        bx = 4 + c * char_w
        by = 4 + r * row_h
        sheet = Image.open(sp).convert("RGBA")
        fw = sheet.width // 4
        for k in range(4):
            frame = sheet.crop((k * fw, 0, (k + 1) * fw, sheet.height))
            frame.thumbnail((cell, cell), Image.NEAREST)
            x = bx + k * cell + (cell - frame.width) // 2
            y = by + (cell - frame.height)
            draw.rectangle([bx + k * cell, by, bx + k * cell + cell, by + cell], fill=(48, 48, 60, 255))
            img.alpha_composite(frame, (x, y))
        draw.text((bx + 2, by + cell + 1), sp.stem.replace("char_", ""), fill=(255, 230, 120, 255))
    img.save(out)
    print(f"OK {len(sheets)} -> {out} ({W}x{H})")


if __name__ == "__main__":
    main()
