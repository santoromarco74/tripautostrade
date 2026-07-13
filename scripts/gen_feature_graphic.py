"""Genera la feature graphic 1024x500 per Google Play Store.

Stile coerente con l'app (Material 3, CLAUDE.md §2): fondo verde autostrada,
pin a goccia col glifo posate come sui marker della mappa, stelle ambra,
wordmark + tagline. Nessun asset esterno: tutto disegnato con Pillow.

Uso:  python3 scripts/gen_feature_graphic.py   (richiede Pillow)
Output: assets/store/feature-graphic.png (1024x500)
"""
import math
import os
from PIL import Image, ImageDraw, ImageFont

OUT_DIR = "/home/user/tripautostrade/assets/store"
os.makedirs(OUT_DIR, exist_ok=True)

# Canvas a supersampling per bordi morbidi, poi ridotto
BASE_W, BASE_H = 1024, 500
S = 3
W, H = BASE_W * S, BASE_H * S

# Palette (constants/Colors.ts)
GREEN = (0, 105, 92)         # #00695C primary
GREEN_DARK = (0, 77, 64)     # #004D40 primary-dark
AMBER = (255, 193, 7)        # #FFC107 accent
WHITE = (255, 255, 255)

FONT_DIR = "/usr/share/fonts/truetype/dejavu"


def font(name, size):
    return ImageFont.truetype(f"{FONT_DIR}/{name}", size * S)


def vertical_gradient(w, h, top, bottom):
    """Gradiente verticale diagonale-ish tra due colori."""
    grad = Image.new("RGB", (1, h))
    for y in range(h):
        t = y / max(1, h - 1)
        grad.putpixel((0, y), tuple(
            int(top[i] + (bottom[i] - top[i]) * t) for i in range(3)))
    return grad.resize((w, h))


def teardrop(draw, cx, cy, r, tip_y, color):
    """Pin a goccia: cerchio + coda triangolare (come gen_pins.py)."""
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=color)
    ang = math.radians(38)
    xo, yo = r * math.cos(ang), r * math.sin(ang)
    draw.polygon([(cx - xo, cy + yo), (cx + xo, cy + yo), (cx, tip_y)], fill=color)


def glyph_fork_knife(draw, cx, cy, scale, color):
    """Forchetta + coltello stilizzati (dallo script dei pin)."""
    s = scale
    fx = cx - 5.2 * s
    tw = 1.5 * s
    for dx in (-3.0 * s, 0, 3.0 * s):
        draw.rounded_rectangle(
            [fx + dx - tw / 2, cy - 9.0 * s, fx + dx + tw / 2, cy - 2.5 * s],
            radius=tw / 2, fill=color)
    draw.rounded_rectangle(
        [fx - 3.0 * s - tw / 2, cy - 4.5 * s, fx + 3.0 * s + tw / 2, cy - 1.0 * s],
        radius=1.5 * s, fill=color)
    draw.rounded_rectangle(
        [fx - tw / 2, cy - 2.0 * s, fx + tw / 2, cy + 9.0 * s],
        radius=tw / 2, fill=color)
    kx = cx + 5.2 * s
    bw = 3.4 * s
    draw.polygon([
        (kx - bw / 2, cy - 9.0 * s), (kx + bw / 2, cy - 5.5 * s),
        (kx + bw / 2, cy + 0.5 * s), (kx - bw / 2 + 0.9 * s, cy + 0.5 * s),
    ], fill=color)
    draw.rounded_rectangle(
        [kx - tw / 2 + 0.4 * s, cy - 0.5 * s, kx + tw / 2 + 0.4 * s, cy + 9.0 * s],
        radius=tw / 2, fill=color)


def star(draw, cx, cy, r, color):
    pts = []
    for i in range(10):
        rad = r if i % 2 == 0 else r * 0.42
        a = math.radians(-90 + i * 36)
        pts.append((cx + rad * math.cos(a), cy + rad * math.sin(a)))
    draw.polygon(pts, fill=color)


def make_pin(size_r):
    """Pin a goccia bianco+verde col glifo, su layer trasparente."""
    pad = int(size_r * 0.5)
    w = int(size_r * 2 + pad * 2)
    h = int(size_r * 3.2 + pad)
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx = w / 2
    cy = pad + size_r
    tip = cy + size_r * 2.0
    teardrop(d, cx, cy, size_r, tip, WHITE)
    teardrop(d, cx, cy, size_r * 0.86, tip - size_r * 0.18, GREEN)
    glyph_fork_knife(d, cx, cy - size_r * 0.06, size_r / 20 * 0.95, WHITE)
    return img


# ── Composizione ─────────────────────────────────────────────────────────────
img = vertical_gradient(W, H, GREEN, GREEN_DARK).convert("RGBA")
draw = ImageDraw.Draw(img)

# Trama leggera: cerchi concentrici tenui a destra (motivo "vicino a te")
ring_c = (int(W * 0.80), int(H * 0.5))
for rr in (150, 250, 350, 450):
    bbox = [ring_c[0] - rr * S, ring_c[1] - rr * S,
            ring_c[0] + rr * S, ring_c[1] + rr * S]
    draw.ellipse(bbox, outline=(255, 255, 255, 18), width=2 * S)

# Pin grande decorativo a destra, dentro i cerchi
big = make_pin(78 * S)
img.alpha_composite(big, (int(W * 0.80 - big.width / 2),
                          int(H * 0.5 - big.height * 0.42)))
# due pin piccoli satellite
small = make_pin(30 * S)
img.alpha_composite(small, (int(W * 0.62), int(H * 0.20)))
img.alpha_composite(small, (int(W * 0.90), int(H * 0.62)))

# ── Testo a sinistra ──
left = 70 * S
draw.text((left, 150 * S), "TripAutostrade",
          font=font("DejaVuSans-Bold.ttf", 62), fill=WHITE)

# Sottotitolo
draw.text((left + 3 * S, 232 * S),
          "Le aree di servizio delle autostrade italiane,",
          font=font("DejaVuSans.ttf", 25), fill=(230, 240, 238))
draw.text((left + 3 * S, 268 * S),
          "scoperte e recensite da chi viaggia.",
          font=font("DejaVuSans.ttf", 25), fill=(230, 240, 238))

# Riga di 5 stelle ambra + claim
sy = 340 * S
for i in range(5):
    star(draw, left + 18 * S + i * 42 * S, sy, 17 * S, AMBER)
draw.text((left + 18 * S + 5 * 42 * S + 14 * S, sy - 20 * S),
          "recensioni vere della community",
          font=font("DejaVuSans.ttf", 22), fill=(255, 255, 255))

# Badge "GRATIS · Android" in basso a sinistra
by = 392 * S
badge = "GRATIS · Nessuna pubblicità"
bf = font("DejaVuSans-Bold.ttf", 19)
bb = draw.textbbox((0, 0), badge, font=bf)
bw = bb[2] - bb[0]
draw.rounded_rectangle(
    [left, by, left + bw + 40 * S, by + 44 * S],
    radius=22 * S, fill=AMBER)
draw.text((left + 20 * S, by + 9 * S), badge, font=bf, fill=GREEN_DARK)

# Riduzione finale
out = img.convert("RGB").resize((BASE_W, BASE_H), Image.LANCZOS)
out_path = f"{OUT_DIR}/feature-graphic.png"
out.save(out_path)
print("OK:", out_path, out.size)
