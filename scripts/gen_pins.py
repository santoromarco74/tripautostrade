"""Genera i pin PNG per i marker mappa (normale + selezionato, 1x/2x/3x)."""
from PIL import Image, ImageDraw
import os

OUT = "/home/user/tripautostrade/assets/pins"
os.makedirs(OUT, exist_ok=True)

# Geometria base (1x): canvas 48x58, cerchio centro (24,22) r18, coda fino a (24,56)
BASE_W, BASE_H = 48, 58
S = 12  # supersampling
W, H = BASE_W * S, BASE_H * S

WHITE = (255, 255, 255, 255)
GREEN = (0, 105, 92, 255)      # Colors.primary #00695C
AMBER = (255, 179, 0, 255)     # ambra scura per contrasto col bianco (#FFB300)
SHADOW = (0, 0, 0, 60)


def teardrop(draw, cx, cy, r, tip_y, color):
    """Cerchio + coda triangolare che scende fino a tip_y."""
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=color)
    # coda: dai fianchi del cerchio (a ~40 gradi sotto l'orizzonte) alla punta
    import math
    ang = math.radians(38)
    x_off = r * math.cos(ang)
    y_off = r * math.sin(ang)
    draw.polygon(
        [(cx - x_off, cy + y_off), (cx + x_off, cy + y_off), (cx, tip_y)],
        fill=color,
    )


def glyph_fork_knife(draw, cx, cy, scale, color):
    """Forchetta (sinistra) e coltello (destra) stilizzati, centrati su (cx, cy)."""
    s = scale
    # ── Forchetta: 3 rebbi + manico ──
    fx = cx - 5.2 * s
    tine_w = 1.5 * s
    # rebbi
    for dx in (-3.0 * s, 0, 3.0 * s):
        draw.rounded_rectangle(
            [fx + dx - tine_w / 2, cy - 9.0 * s, fx + dx + tine_w / 2, cy - 2.5 * s],
            radius=tine_w / 2, fill=color)
    # arco che unisce i rebbi
    draw.rounded_rectangle(
        [fx - 3.0 * s - tine_w / 2, cy - 4.5 * s, fx + 3.0 * s + tine_w / 2, cy - 1.0 * s],
        radius=1.5 * s, fill=color)
    # manico
    draw.rounded_rectangle(
        [fx - tine_w / 2, cy - 2.0 * s, fx + tine_w / 2, cy + 9.0 * s],
        radius=tine_w / 2, fill=color)

    # ── Coltello: lama affusolata + manico ──
    kx = cx + 5.2 * s
    blade_w = 3.4 * s
    draw.polygon(
        [
            (kx - blade_w / 2, cy - 9.0 * s),          # punta alta sinistra
            (kx + blade_w / 2, cy - 5.5 * s),          # dorso
            (kx + blade_w / 2, cy + 0.5 * s),          # base lama destra
            (kx - blade_w / 2 + 0.9 * s, cy + 0.5 * s) # base lama sinistra
        ],
        fill=color,
    )
    draw.rounded_rectangle(
        [kx - tine_w / 2 + 0.4 * s, cy - 0.5 * s, kx + tine_w / 2 + 0.4 * s, cy + 9.0 * s],
        radius=tine_w / 2, fill=color)


def make_pin(fill_color, name):
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    cx, cy = 24 * S, 22 * S
    # ombra morbida sotto la punta
    d.ellipse([cx - 9 * S, 53 * S, cx + 9 * S, 57.5 * S], fill=SHADOW)
    # bordo bianco
    teardrop(d, cx, cy, 20 * S, 57 * S, WHITE)
    # corpo colorato
    teardrop(d, cx, cy, 17.2 * S, 53.5 * S, fill_color)
    # glifo posate bianco
    glyph_fork_knife(d, cx, cy - 1.5 * S, S * 0.95, WHITE)

    for mult, suffix in ((1, ""), (2, "@2x"), (3, "@3x")):
        out = img.resize((BASE_W * mult, BASE_H * mult), Image.LANCZOS)
        out.save(f"{OUT}/{name}{suffix}.png")


make_pin(GREEN, "pin")
make_pin(AMBER, "pin-selected")
print("OK:", sorted(os.listdir(OUT)))
