"""Selección automática de poses y montaje de hojas para TODOS los personajes del zip.

Los fotogramas vienen sueltos, de tamaño variable y sin etiquetar. En vez de
elegir por índice fijo (que no es constante entre personajes), medimos cada
fotograma y elegimos por forma:

  - Se descartan los efectos (auras, ondas, bolas de energía): son anchos,
    cuadrados o muy pequeños, o tienen color muy saturado y uniforme.
  - idle  = pose "de pie": alta y estrecha (ratio alto/ancho grande), con los
            píxeles repartidos en vertical y una base (pies) estrecha.
  - walk  = dos poses parecidas al idle en altura pero con la base algo más ancha
            (piernas separadas); se eligen las dos más distintas entre sí.
  - atk   = pose con más anchura en la franja media (brazo/pierna extendidos)
            manteniendo altura de personaje.

Salida: una hoja <id>.png de 4 fotogramas (idle, walk1, walk2, atk), todos del
mismo tamaño, vista lateral, alineados por los pies. Escribe también un
manifest.json con {id: [w,h]} para registrar el tamaño en el juego.

Uso: python scripts/auto_sprites.py <raiz_zip> <carpeta_salida> <mapping.json>
  mapping.json = { "char_goku": "GOKU fases/Goku", ... }  (ruta relativa a la raíz)
"""
import json
import sys
from pathlib import Path
from PIL import Image


def remove_bg(im):
    """Los fotogramas vienen en RGB con un fondo de color sólido (normalmente
    blanco, a veces gris claro u otro tono). Lo volvemos transparente con un
    flood fill desde los bordes usando como referencia el COLOR REAL de las
    esquinas, con tolerancia. Así no dependemos de que el fondo sea blanco puro
    y NO borramos los colores internos del personaje (ojos, gi, destellos)."""
    im = im.convert("RGBA")
    w, h = im.size
    px = im.load()

    # Color de fondo = el más repetido entre las cuatro esquinas.
    corners = [px[0, 0], px[w - 1, 0], px[0, h - 1], px[w - 1, h - 1]]
    from collections import Counter
    bg = Counter((c[0], c[1], c[2]) for c in corners).most_common(1)[0][0]

    tol = 36  # tolerancia por canal

    def is_bg(c):
        return abs(c[0] - bg[0]) <= tol and abs(c[1] - bg[1]) <= tol and abs(c[2] - bg[2]) <= tol

    from collections import deque
    seen = [[False] * w for _ in range(h)]
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if is_bg(px[x, y]) and not seen[y][x]:
                q.append((x, y)); seen[y][x] = True
    for y in range(h):
        for x in (0, w - 1):
            if is_bg(px[x, y]) and not seen[y][x]:
                q.append((x, y)); seen[y][x] = True
    while q:
        x, y = q.popleft()
        px[x, y] = (0, 0, 0, 0)
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h and not seen[ny][nx] and is_bg(px[nx, ny]):
                seen[ny][nx] = True
                q.append((nx, ny))
    return im


def autocrop(im):
    im = remove_bg(im)
    bbox = im.getbbox()
    return im.crop(bbox) if bbox else im


def opaque_mask(im):
    """Devuelve (ancho, alto, columnas_con_pixel, filas_con_pixel, pixeles_opacos)."""
    a = im.split()[-1]
    w, h = im.size
    px = a.load()
    cols = [0] * w
    rows = [0] * h
    total = 0
    for y in range(h):
        for x in range(w):
            if px[x, y] > 40:
                cols[x] += 1
                rows[y] += 1
                total += 1
    return w, h, cols, rows, total


def looks_like_effect(im):
    """Un efecto (aura, bola de energía, onda, disco) no es un personaje.
    Lo detectamos por forma (demasiado cuadrado/ancho o pequeño) y por color
    (dominado por amarillo/naranja/morado brillante y saturado, o casi sólido)."""
    w, h = im.size
    if h < 38 or w < 14:
        return True
    ratio = h / w
    if ratio < 1.05:           # un personaje de pie es claramente más alto que ancho
        return True
    small = im.resize((10, 10))
    opaque = [p for p in small.getdata() if p[3] > 60]
    if not opaque:
        return True
    n = len(opaque)
    # relleno del recorte: una bola/disco llena casi todo el bounding box
    if n / 100.0 > 0.72:
        return True

    def sat(p):
        mx, mn = max(p[0], p[1], p[2]), min(p[0], p[1], p[2])
        return (mx - mn) / mx if mx else 0

    # Amarillo MUY brillante de energía (no el naranja del gi de Goku, que es
    # más oscuro y convive con negro/piel). Exigimos verde alto además de rojo.
    energy = sum(1 for p in opaque if p[0] > 225 and p[1] > 205 and p[2] < 150 and sat(p) > 0.35)
    # morado/rosa brillante de aura
    purple = sum(1 for p in opaque if p[0] > 150 and p[2] > 170 and p[1] < p[0] * 0.7 and sat(p) > 0.35)
    # azul/cian brillante de onda de energía (Kamehameha)
    cyan = sum(1 for p in opaque if p[2] > 200 and p[1] > 150 and p[0] < p[2] * 0.8 and sat(p) > 0.3)
    if cyan / n > 0.5:
        return True
    # blanco casi puro (destellos)
    white = sum(1 for p in opaque if p[0] > 225 and p[1] > 225 and p[2] > 225)
    # Solo es efecto si ese color domina de verdad (>60% del recorte).
    if (energy + purple + white) / n > 0.6:
        return True
    return False


def features(im):
    w, h, cols, rows, total = opaque_mask(im)
    if total == 0:
        return None
    # anchura de la base (25% inferior): piernas
    base_from = int(h * 0.75)
    base_w = sum(1 for x in range(w) if max(rows[base_from:]) and cols[x] and any_pixel_in_range(im, x, base_from, h))
    # anchura media (franja 35%-65%): brazos
    midw = width_in_band(im, int(h * 0.35), int(h * 0.65))
    basew = width_in_band(im, base_from, h)
    topw = width_in_band(im, 0, int(h * 0.3))
    return {
        "w": w, "h": h, "total": total,
        "ratio": h / w,
        "midw": midw, "basew": basew, "topw": topw,
        "fill": total / (w * h),
    }


def any_pixel_in_range(im, x, y0, y1):
    a = im.split()[-1].load()
    for y in range(y0, y1):
        if a[x, y] > 40:
            return True
    return False


def width_in_band(im, y0, y1):
    a = im.split()[-1].load()
    w, h = im.size
    y0 = max(0, y0); y1 = min(h, y1)
    minx, maxx = w, 0
    for y in range(y0, y1):
        for x in range(w):
            if a[x, y] > 40:
                if x < minx: minx = x
                if x > maxx: maxx = x
    return max(0, maxx - minx + 1)


def pick_poses(frames):
    """frames = lista de (indice, Image autocropped). Devuelve [idle, walk1, walk2, atk]."""
    # El tamaño separa personaje de efecto mucho mejor que el color (Goku Blue es
    # azul como un Kamehameha; distinguirlos por color es imposible). El personaje
    # real es el grupo de fotogramas de ALTURA MÁS FRECUENTE; las ondas y auras
    # son claramente más grandes. Tomamos la altura modal (redondeada) como base.
    heights = [im.height for _, im in frames]
    buckets = {}
    for h in heights:
        b = round(h / 6) * 6
        buckets[b] = buckets.get(b, 0) + 1
    base_h = max(buckets, key=lambda b: (buckets[b], -b))  # moda, desempata por menor

    chars = []
    for idx, im in frames:
        f = features(im)
        if not f:
            continue
        # tamaño de personaje (cerca de la altura modal) y figura vertical
        if not (base_h * 0.7 <= f["h"] <= base_h * 1.3):
            continue
        if f["ratio"] < 0.95 or f["w"] < 14 or f["fill"] < 0.18:
            continue
        # aún descartamos efectos evidentes (bola casi sólida, onda apaisada)
        if looks_like_effect(im) and f["fill"] > 0.6:
            continue
        chars.append((idx, im, f))
    if not chars:
        # nada cuadra: usa el primer frame de altura modal, o el primero
        for idx, im in frames:
            if abs(im.height - base_h) <= 8:
                return [im, im, im, im]
        idx, im = frames[0]
        return [im, im, im, im]

    median_h = sorted(f["h"] for _, _, f in chars)[len(chars) // 2]
    median_w = sorted(f["w"] for _, _, f in chars)[len(chars) // 2]

    def human_penalty(f):
        # penaliza alejarse del tamaño típico (filtra saltos, estelas residuales)
        return abs(f["h"] - median_h) / median_h + abs(f["w"] - median_w) / median_w

    # idle: vertical, brazos y piernas recogidos, tamaño típico. Penaliza con
    # fuerza las poses demasiado estrechas (estelas/poses de lanzar ki).
    min_ok_w = median_w * 0.72
    def idle_score(t):
        _, _, f = t
        thin = 3.0 if f["w"] < min_ok_w else 0.0
        return f["ratio"] * 1.1 - human_penalty(f) - f["midw"] / f["w"] - f["basew"] / f["w"] * 0.5 - thin
    idle = max(chars, key=idle_score)
    ih = idle[2]["h"]

    # Para andar y atacar, solo poses de tamaño de personaje (no ondas anchas).
    near = [t for t in chars if abs(t[2]["h"] - ih) <= ih * 0.25 and t[2]["w"] <= median_w * 1.6]
    if len(near) < 3:
        near = chars

    # walk: base algo más ancha que el idle (piernas abiertas); dos más distintas.
    walk_pool = [t for t in near if t is not idle and t[2]["ratio"] >= 0.95] or [t for t in near if t is not idle]
    walkers = sorted(walk_pool, key=lambda t: -t[2]["basew"])
    if len(walkers) >= 2:
        walk = [walkers[0], walkers[len(walkers) // 2]]
    else:
        walk = (walkers + [idle, idle])[:2]

    # atk: brazo/pierna extendido = más anchura media que el idle, pero debe
    # seguir siendo una figura de personaje (vertical, altura ~ idle). Las ondas
    # de energía son apaisadas (ratio < 1) y quedan descartadas.
    idle_mid = idle[2]["midw"]
    iw = idle[2]["w"]
    # el ataque debe ser claramente una figura de personaje: alto >= ancho y
    # no mucho más ancho que el idle (una onda es ancha y baja).
    atk_pool = [
        t for t in near
        if t is not idle and t[2]["ratio"] >= 1.1 and t[2]["w"] <= iw * 1.5 and abs(t[2]["h"] - ih) <= ih * 0.2
    ]
    if not atk_pool:
        atk_pool = [t for t in near if t is not idle] or [idle]
    def atk_score(t):
        _, _, f = t
        return (f["midw"] - idle_mid) - abs(f["h"] - ih) / ih * 18
    atk = max(atk_pool, key=atk_score)

    # Salvaguarda anti-"estela": si el ataque elegido es mucho más estrecho que
    # el idle (pose de lanzar ki con una línea de energía) o tiene poco cuerpo,
    # preferimos una pose de andar, que siempre es figura completa.
    iw = idle[2]["w"]
    if atk[2]["w"] < iw * 0.62:
        atk = walk[0]

    return [idle[1], walk[0][1], walk[1][1], atk[1]]


def build_sheet(poses, out):
    cw = max(p.width for p in poses) + 2
    ch = max(p.height for p in poses) + 2
    sheet = Image.new("RGBA", (cw * len(poses), ch), (0, 0, 0, 0))
    for k, p in enumerate(poses):
        ox = k * cw + (cw - p.width) // 2
        oy = ch - p.height - 1
        sheet.alpha_composite(p, (ox, oy))
    sheet.save(out)
    return cw, ch


def natural_key(name):
    import re
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r"(\d+)", name)]


def main():
    root = Path(sys.argv[1])
    outdir = Path(sys.argv[2])
    mapping = json.loads(Path(sys.argv[3]).read_text(encoding="utf-8"))
    outdir.mkdir(parents=True, exist_ok=True)
    sizes = {}
    for key, rel in mapping.items():
        folder = root / rel
        files = sorted(folder.glob("*.png"), key=lambda p: natural_key(p.name))
        if not files:
            print(f"SKIP {key}: sin PNG en {rel}")
            continue
        frames = [(i, autocrop(Image.open(f).convert("RGBA"))) for i, f in enumerate(files)]
        poses = pick_poses(frames)
        cw, ch = build_sheet(poses, outdir / f"{key}.png")
        sizes[key] = [cw, ch]
        print(f"OK {key}  {cw}x{ch}")
    (outdir / "sizes.json").write_text(json.dumps(sizes, indent=0), encoding="utf-8")
    print(f"TOTAL {len(sizes)} hojas")


if __name__ == "__main__":
    main()
